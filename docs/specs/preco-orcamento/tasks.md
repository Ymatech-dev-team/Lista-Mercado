# Tasks — Preço & Orçamento

Checklist dependency-ordered. Cada escopo **fecha e para para review (Fase 4)** antes do próximo.
Legenda: `[ ]` a fazer · `[x]` feito · `→` critério de aceite (EARS) · `T:` teste que prova.

---

## Escopo 0 — Fundação (banco + tipos + dinheiro) — SEM UI

- [ ] **0.1 SQL idempotente no Neon (JP roda, dev primeiro).** Colunas `list_items.unit_price_cents`,
  `users.monthly_budget_cents` + CHECKs `>= 0`. → RNF1/RNF2/ADR-1/ADR-5. `T:` query de verificação retorna 2
  linhas `integer`/`YES`. **(pendente — JP rodando no Neon)**
- [x] **0.2 `schema.ts`:** `unitPriceCents` em `listItems`, `monthlyBudgetCents` em `users`. Build verde.
- [x] **0.3 `src/lib/money.ts`:** `formatBRL` + `parseBRLToCents`. 13 testes passando (parse BR, teto, zero, sem drift de float).
- [x] **0.4 `src/lib/validation/list.ts`:** `priceCentsSchema`/`budgetCentsSchema` sem `.catch`. 10 testes passando.
- [x] **0.5 tooling:** vitest instalado + script `npm run test` (fundação de qualidade das próximas sprints).

## Escopo 1 — Preço por item (DB + API + fila offline + UI Opção B) — FEITO (review aplicado)

- [x] **1.1 `list-items.ts`:** `getItemsForList` retorna `unitPriceCents`; `setItemPrice(userId,itemId,cents|null)`
  espelhando `setItemQuantity` (`ownedByUser` → `false` se não é dono); `addItem` merge **não toca** preço;
  `restoreItem` grava preço. → RF1/RF6/RF11/RNF3/RNF8. `T:` `setItemPrice` de outro usuário retorna `false` (IDOR); `null` limpa; merge preserva preço.
- [x] **1.2 `PUT /api/items/[id]/price`:** `originOk` + `getSessionUserId`→401 + `priceCentsSchema` (aceita `null`) + `setItemPrice`→404. → RF7/RNF4/RNF6. `T:` 401 sem sessão, 404 item de outro, 400 preço inválido, 200 ok.
- [x] **1.3 Fila offline generalizada:** `mm:pending:${listId}` passa a `{ itemId: { purchased?, quantity?, priceCents? } }`; `flush` roteia por campo; `reconcile` preserva pendências; `changeQty` passa a **enfileirar**. → RF8/RF9/RF10. `T:` unit da fila (merge de campos, dequeue por sucesso).
- [x] **1.4 `ListItem` Opção B:** linha 2 com stepper + campo de preço (`inputMode="decimal"`), autofill editável, subtotal, estados "—"/"definir preço"; somente-leitura quando concluída. → RF2/RF3/RF5/RF15/D2. `T:` render states.
- [x] **1.5 `list-view`:** `putPrice` com fila; subtotal/total otimista; rodapé "total parcial · N sem preço". → RF5/RF12/RF13.

## Escopo 2 — Conclusão imutável + repetir + preço lembrado

- [ ] **2.1** `concludeListAction`/UI: `ConfirmDialog` se há item sem preço. → RF16.
- [ ] **2.2** Histórico somente-leitura (sem stepper/edição de preço). → RF15.
- [ ] **2.3** `repeatLastAction` não copia preço como definitivo; oferece como lembrado. → RF17.
- [ ] **2.4** `products.getRememberedPrices(userId, productIds)` (`DISTINCT ON`, escopado) + autofill. → RF24/RF25/ADR-2/RNF3.

## Escopo 3 — Gasto do mês + comparação + teto

- [ ] **3.1** `getMonthlySpendCents(userId)` + **corrigir fuso** em `getItemsPurchasedThisMonth` (`AT TIME ZONE 'America/Sao_Paulo'`). → RF18/RF19/D4/ADR-4/RNF5. `T:` compra 30/22h BRT cai em setembro, não outubro.
- [ ] **3.2** `getListTotalCents` + `getPriceCoverage` + `getLastCompletedTotalCents`. → RF20/RF21/RF22/RF23.
- [ ] **3.3** `users`: get/set budget + `setBudgetAction` + UI no Perfil. → RF26.
- [ ] **3.4** Home: painel do mês (gasto, comparação, barra de teto 3 estados). → RF27/RF28/RF29/RF30.

## Escopo 4 — LGPD

- [ ] **4.1** `/api/export` inclui `unitPriceCents` por item, total por lista e `monthlyBudgetCents`. → RNF7.

---

Cobertura EARS: RF1-RF30 + RNF1-RNF8 mapeados acima. `/analyze` de consistência roda no fechamento de cada escopo (Fase 4).
