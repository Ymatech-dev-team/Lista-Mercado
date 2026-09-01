# Design — Preço & Orçamento

Como construir os requisitos de [requirements.md](requirements.md). Decisões validadas pelo painel
adversarial (arquiteto · jornada · segurança/dinheiro) e o layout aprovado no mockup (Opção B, 2ª linha).

---

## 1. Decisões de arquitetura (ADR)

- **ADR-1 — Preço = snapshot em `list_items.unit_price_cents integer NULL`.** Preço unitário no momento
  daquela lista, em centavos inteiros. Não fica no catálogo (`products`) porque preço muda toda semana e o
  catálogo reescreveria o passado. A imutabilidade do histórico (RF14) vem de **não mutar itens de lista
  concluída** (RF15) — a coluna já congela por construção; não é preciso copiar linhas na conclusão.
- **ADR-2 — Preço lembrado = derivar** (`DISTINCT ON (product_id) ... ORDER BY completed_at DESC`), sem cache
  no v1. Fonte da verdade única; promover a `products.last_price_cents` só sob prova de latência, atualizado
  exclusivamente no `completeActiveList`.
- **ADR-3 — Sem `addedByUserId` agora** (YAGNI). Compartilhamento (Sprint 4) é refactor de autorização, não
  coluna; `list_items.createdAt` já reconstrói ordem/tempo.
- **ADR-4 — Fuso fixo `America/Sao_Paulo`** nas fronteiras de mês (corrige bug latente).
- **ADR-5 — Teto = coluna `users.monthly_budget_cents integer NULL`** (não tabela por mês).

## 2. Mudanças de banco (JP roda manual no Neon)

DDL idempotente. Rodar **dev primeiro**; prod só com ok separado. `schema.ts` (tipos Drizzle) é atualizado no
código em espelho, mas o DDL é manual (padrão do projeto).

```sql
BEGIN;

ALTER TABLE list_items ADD COLUMN IF NOT EXISTS unit_price_cents integer;
ALTER TABLE users      ADD COLUMN IF NOT EXISTS monthly_budget_cents integer;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'list_items_price_chk') THEN
    ALTER TABLE list_items
      ADD CONSTRAINT list_items_price_chk CHECK (unit_price_cents IS NULL OR unit_price_cents >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_budget_chk') THEN
    ALTER TABLE users
      ADD CONSTRAINT users_budget_chk CHECK (monthly_budget_cents IS NULL OR monthly_budget_cents >= 0);
  END IF;
END $$;

COMMIT;
```

Verificação (esperado: 2 linhas, `integer`, `YES`):

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE (table_name = 'list_items' AND column_name = 'unit_price_cents')
   OR (table_name = 'users' AND column_name = 'monthly_budget_cents')
ORDER BY table_name;
```

Índices: reaproveitam os existentes (`list_items_product_id_idx`, `lists_user_status_completed_idx`). Sem novo
índice no v1; reavaliar se o "preço lembrado" mostrar latência.

## 3. Helper de dinheiro — `src/lib/money.ts` (novo)

- `formatBRL(cents: number): string` → `(cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})`.
  **Só na borda de UI.** Nunca reintroduz float no cálculo.
- `parseBRLToCents(input: string): number | null` → aceita "12,90"/"12.90"/"1290" conforme regra; retorna
  centavos inteiros ou `null` se inválido. Parsing no cliente; servidor revalida o inteiro.
- Validação servidor em `src/lib/validation/list.ts`: `priceCentsSchema = z.number().int().min(0).max(9_999_999)`
  — **sem `.catch`** (rejeita, não coage). `budgetCentsSchema` idem.

## 4. Camada de dados — `src/db/*`

Tudo herda o anti-IDOR existente (RNF3). Escritas via `ownedByUser`; leituras/agregações via `innerJoin lists`
com `eq(lists.userId, userId)`.

- **`list-items.ts`**
  - `getItemsForList` passa a retornar `unitPriceCents`.
  - `setItemPrice(userId, itemId, priceCents: number | null)` — espelha `setItemQuantity`:
    `.update().set({ unitPriceCents, updatedAt }).where(and(eq(id, itemId), ownedByUser(userId))).returning({id})`;
    `false` se 0 linhas. **UPDATE de coluna única** (RNF8) — não lê-e-reescreve preço+quantidade juntos.
  - `restoreItem` passa a aceitar/gravar `unitPriceCents` (RF11).
  - `addItem` (merge): `onConflictDoUpdate` **não toca** `unit_price_cents` (RF6 — preserva o que havia).
- **`lists.ts`**
  - `getMonthlySpendCents(userId)` = `SUM(quantity * unit_price_cents)` de itens `is_purchased` em listas
    `completed` no mês corrente, `WHERE unit_price_cents IS NOT NULL`, mês por
    `date_trunc('month', completed_at AT TIME ZONE 'America/Sao_Paulo')` (RF18/RF19, ADR-4). Corrigir o mesmo
    fuso em `getItemsPurchasedThisMonth` (bug latente, D4).
  - `getListTotalCents(userId, listId)` + `getPriceCoverage(userId, listId)` (`count(*) filter (where unit_price_cents is not null)` vs total) — reusa o padrão de `getCompletedLists` (RF20-RF22).
  - `getLastCompletedTotalCents(userId)` para a comparação (RF20).
- **`products.ts`**
  - `getRememberedPrices(userId, productIds: string[])` → `DISTINCT ON (product_id)` do `unit_price_cents` da
    última compra concluída, escopado por `userId` (ADR-2, RF24). Retorna mapa `productId → cents`.
- **`users.ts`** (ou onde mora o perfil)
  - `getMonthlyBudgetCents(userId)` / `setMonthlyBudgetCents(userId, cents | null)`.

## 5. API / Ações

- **Preço:** `PUT /api/items/[id]/price` (Route Handler), **espelhando** `quantity/route.ts`: `originOk` (RNF6)
  + `getSessionUserId()` → 401 + zod `priceCentsSchema` (aceita `null` para "remover preço") + `setItemPrice`
  → 404 se não é do dono. Route Handler (não Server Action) porque o preço entra na **fila de reenvio offline**
  (RF8), igual a `purchased`/`quantity`.
- **Teto:** Server Action `setBudgetAction(cents | null)` (`requireUser` + `budgetCentsSchema`) — não precisa de
  fila offline; CSRF coberto pelo framework.
- **`/api/export`** passa a incluir `unitPriceCents` por item, total por lista e `monthlyBudgetCents` (RNF7/LGPD).

## 6. Cliente — fluxo (Opção B)

- **Fila de reenvio generalizada** (RF8-RF10): hoje `mm:pending:${listId}` guarda `{ itemId: boolean }` só de
  `purchased`. Passa a guardar **por item** `{ purchased?: boolean, quantity?: number, priceCents?: number|null }`.
  `flush` reenvia cada campo pendente ao endpoint certo; `reconcile` preserva qualquer campo pendente sobre o
  servidor. Fecha também o buraco atual da quantidade (`changeQty` só revertia).
- **`ListItem` (Opção B):** linha 1 = check + nome + subtotal (mono); linha 2 = stepper + `×` + campo de preço.
  Campo com `inputMode="decimal"` (RF3). **Autofill editável** (D2): se há preço lembrado, o campo já vem
  preenchido com ele (editável); primeira compra → vazio com placeholder "definir preço" (RF25). Subtotal e
  total recalculam no cliente na hora (RF5/RF12). Item sem preço → "—" (RF2).
- **Total ao vivo:** rodapé "total parcial · N sem preço" quando há item sem preço (RF12); calculado on-read a
  partir dos itens em memória.
- **Concluir:** se há item sem preço, `ConfirmDialog` avisando que o total ficará subestimado (RF16).
- **Lista concluída (histórico):** preços somente-leitura, sem stepper/edição (RF15).

## 7. Painel do mês (Home `/inicio`) + teto no Perfil

- Card "gasto no mês" (mono) + card "esta compra" com a comparação ("12% abaixo da última", ou estado vazio se
  não há base — RF23). Barra de teto com 3 estados (RF27-RF30): neutro/verde (dentro), âmbar (≥80%), vermelho
  (estourou). **Cores semânticas** (não contam como o verde de acento da marca); vermelho só sinaliza, nunca
  trava. Definir/editar teto vai no **Perfil** (seção "orçamento").

## 8. Segurança & resiliência (mapa dos RNF)

Centavos inteiros zero-float (RNF1) · NULL≠0 (RNF2) · `ownedByUser` em escrita + `innerJoin userId` em leitura
(RNF3) · zod servidor sem `.catch` (RNF4) · agregação parametrizada `${}` sem `sql.raw` (RNF5) · `originOk` no
route (RNF6) · export/LGPD com preço (RNF7) · UPDATE de coluna única, total on-read (RNF8). Corrida preço×qtd:
colunas separadas em UPDATEs independentes → last-write-wins por coluna, sem read-modify-write.

## 9. Fora de escopo (reforço)

Categorias/corredor (Sprint 2), scanner/nota fiscal, cotação entre mercados, multi-moeda, fuso por perfil,
cache de preço lembrado, teto variável por mês.
