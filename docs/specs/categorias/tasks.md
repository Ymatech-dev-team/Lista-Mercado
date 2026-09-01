# Tasks — Categorias por corredor

Dependency-ordered. Cada escopo fecha e PARA para review (Fase 4). `→` critério de aceite (EARS) · `T:` teste.

## Escopo 0 — Fundação (banco + fonte única + palpite)
- [ ] **0.1 SQL** no Neon (JP roda): `products.category text NOT NULL DEFAULT 'outros'` + CHECK. → RNF2. `T:` verificação retorna category/text/NO/'outros'.
- [ ] **0.2 `schema.ts`**: `products.category` (`text`, notNull, default "outros"). `T:` build.
- [ ] **0.3 `src/lib/categories.ts`** (fonte única): `CATEGORIES` ordenado, `Category`, `isCategory`, `categoryLabel`, `guessCategory`. → RNF1/RF1. `T:` unit — palpites (arroz→mercearia, banana→hortifruti, "Água Sanitária"→limpeza vs "água"→bebidas, desconhecido→outros).

## Escopo 1 — Dados + auto-categorização
- [ ] **1.1 `products.ts`**: `findOrCreateProduct` grava `guessCategory` no INSERT (`set` do conflito NÃO toca category); `setProductCategory(userId,productId,category)` escopado por `products.user_id`, valida `isCategory` → false se 0 linhas. → RF1/RF2/RF3/RNF4. `T:` isCategory rejeita fora da união.
- [ ] **1.2 `list-items.ts`**: `getItemsForList` retorna `category`. → RF6.
- [ ] **1.3 `lista/actions.ts`**: `setCategoryAction(productId, category)` (requireUser + isCategory + revalidate). → RF3.
- [ ] **1.4 `export.ts`**: item inclui `categoria` (LGPD).

## Escopo 2 — Lista agrupada (UI)
- [ ] **2.1** `groupByCategory(items)` (em categories.ts): agrupa + ordena seções por corredor, itens por createdAt. `T:` unit — ordem das seções, seção vazia omitida.
- [ ] **2.2** `list-view`: render agrupado com cabeçalhos de seção (fora do ListItem); progresso/total globais inalterados; seção some ao esvaziar. → RF6/RF7/RF8/RF9/RF10/RF11.

## Escopo 3 — Controle "⋯" (trocar categoria + remover)
- [ ] **3.1** `ItemActionsDialog` (Radix Dialog): 10 categorias (atual destacada) + "Remover". → RF5.
- [ ] **3.2** `ListItem`: botão "⋯" no lugar da lixeira solta; abre o dialog; sem bubbling pro toggle. `changeCategory`→setCategoryAction; remover mantém fluxo otimista. → RF4/RF5.

## Escopo 4 — Histórico agrupado
- [ ] **4.1** `historico/[id]`: agrupa por categoria (mesmo helper), read-only, sem "⋯". → RF13/RF14.

Cobertura: RF1-RF15 + RNF1-RNF5.
