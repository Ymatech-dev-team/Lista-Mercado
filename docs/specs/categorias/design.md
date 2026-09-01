# Design — Categorias por corredor

Como construir [requirements.md](requirements.md). Validado pelo painel (arquiteto + jornada) e mockup aprovado
(lista agrupada com cabeçalhos de seção; controle de categoria = menu "⋯", Opção C).

## 1. ADRs

- **ADR-1** — `products.category text NOT NULL DEFAULT 'outros'` + `CHECK (category IN (...))`. Não enum nativo.
- **ADR-2** — Fonte única `src/lib/categories.ts`: uma estrutura ORDENADA (índice = ordem de corredor) que serve
  a: união TS, espelho do CHECK, ordem das seções e dicionário de palpites.
- **ADR-3** — Sem snapshot. Histórico agrupa pela categoria ATUAL do produto (RNF3). Muda zero dinheiro.
- **ADR-4** — Escrita de categoria escopada por `products.user_id` (não `ownedActiveByUser`); valida a categoria
  no servidor; SEM gate de lista ativa (pode tocar histórico).
- **ADR-5** — Agrupamento no cliente; array plano; progresso/total globais.
- **ADR-6** — Trocar categoria/remover via menu "⋯" (reusa `@radix-ui/react-dialog` — sem dep nova).

## 2. Mudanças de banco (JP roda manual no Neon; banco único dev=prod → additivo e seguro)

```sql
BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'outros';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_chk') THEN
    ALTER TABLE products ADD CONSTRAINT products_category_chk
      CHECK (category IN ('hortifruti','padaria','acougue','laticinios','mercearia','bebidas','congelados','limpeza','higiene','outros'));
  END IF;
END $$;

COMMIT;
```

Verificação (esperado: `category` · `text` · `NO` · `'outros'::text`):

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'category';
```

Backfill (D1a): o `DEFAULT 'outros'` já preenche os produtos existentes. Editáveis conforme o uso.

## 3. `src/lib/categories.ts` (nova — fonte única)

- `CATEGORIES`: array ordenado `[{ key, label }]` na ordem de corredor — `hortifruti · padaria · acougue ·
  laticinios · mercearia · bebidas · congelados · limpeza · higiene · outros`. `key` = slug (bate com o CHECK),
  `label` = exibição ("Hortifrúti"…).
- `type Category = (typeof CATEGORIES)[number]["key"]` (união TS).
- `CATEGORY_KEYS: Category[]` (para validação e ordenação).
- `isCategory(x): x is Category`.
- `guessCategory(rawName): Category` — normaliza com `normalizeProductName` e casa contra um dicionário de tokens
  (`arroz/feijao→mercearia`, `banana/tomate/alface→hortifruti`, `leite/queijo→laticinios`, `pao→padaria`,
  `carne/frango→acougue`, `refrigerante/cerveja/agua→bebidas`, `sabao/detergente→limpeza`, `sabonete/shampoo→higiene`,
  `sorvete/congelado→congelados`); sem match → `'outros'`.
- Testável no vitest (dicionário é função pura) — teste-que-prova dos palpites.

## 4. Camada de dados

- **`schema.ts`** — `products.category: text("category").notNull().default("outros")`.
- **`products.ts`**
  - `findOrCreateProduct`: `values({ ..., category: guessCategory(rawName) })`; o `set` do `onConflictDoUpdate`
    **NÃO** toca `category` (preserva override — ADR).
  - `setProductCategory(userId, productId, category)`: valida `isCategory`; `UPDATE ... WHERE id=? AND user_id=?
    AND deleted_at IS NULL RETURNING id` → `false` se 0 linhas (anti-IDOR, ADR-4).
- **`list-items.ts`** — `getItemsForList` soma `category: products.category` ao select (join já existe).
- **`export.ts`** — item passa a incluir `categoria` (LGPD, dado do usuário).

## 5. Ações e cliente

- **Server action** `setCategoryAction(productId, category)` em `lista/actions.ts`: `requireUser` + `isCategory`
  + `setProductCategory` + `revalidatePath("/lista")` + `revalidatePath("/inicio")`. Não-otimista (add já é assim).
- **Agrupamento** (`categories.ts` helper `groupByCategory(items)` ou inline em `list-view`): agrupa o array plano
  por `category`, ordena seções por `CATEGORIES`, itens dentro mantêm a ordem de `createdAt`. Seção vazia não
  renderiza. Progresso X/Y e total = `reduce` global (inalterado).
- **Cabeçalho de seção**: fora do `ListItem` (eyebrow font-mono uppercase + filete de acento), não quebra as
  bordas da "Opção B".
- **`ListItem`**: troca a lixeira solta por um botão "⋯" que abre um **ItemActionsDialog** (Radix Dialog):
  - lista as 10 categorias (a atual destacada) → ao escolher, chama `onCategoryChange(key)` e fecha;
  - botão "Remover item" → chama `onRemove`.
  - O trigger "⋯" não borbulha para `onToggle`/`onRemove` (stopPropagation / botão irmão do toggle).
- **`list-view`**: `changeCategory(item, key)` → `setCategoryAction(item.productId, key)` (revalidate regruça).
  `onRemove` continua o fluxo otimista atual.
- **Histórico** (`historico/[id]`): agrupa por categoria (mesmo helper), read-only, sem "⋯".

## 6. Segurança & resiliência

- IDOR: escrita por `products.user_id` (ADR-4); leitura de categoria já vem do join escopado.
- Validação server-side da categoria (`isCategory`) — rejeita valor fora da união (o CHECK é a segunda linha).
- Regrouping é view-only; nenhum dinheiro/quantidade afetado. Sem fila offline (server action + revalidate).
- Evento do "⋯" isolado do toggle/remover (jornada P0 #4).
- Degradação: produto sempre tem categoria (DEFAULT) → agrupamento nunca vê bucket nulo.

## 7. Fora de escopo

Reordenar corredores a gosto (constante fixa no v1), layout por mercado, código de barras, categoria por API.
