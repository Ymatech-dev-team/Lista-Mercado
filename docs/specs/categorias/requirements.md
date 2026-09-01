# Requirements — Categorias por corredor

Sprint 2 do roadmap de enriquecimento. Requisitos em EARS PT-BR (critério de aceite testável).
Validado por painel adversarial (arquiteto · jornada) em 2026-09-01.

## 1. Visão

A lista deixa de ser uma pilha solta e vira **roteiro de compra**: itens agrupados por seção do mercado,
ordenados pela sequência de corredor, com categoria auto-adivinhada e editável. Escopo **não** inclui:
reordenar corredores a gosto (fica pra depois), layout por mercado, código de barras.

## 2. Princípios / decisões de arquitetura (viram ADR no design)

- **RNF1 — Fonte única da verdade.** `src/lib/categories.ts` exporta UMA estrutura ordenada que serve a: (a) tipo
  união TS, (b) espelho do `CHECK` do banco, (c) ordem de corredor (índice = posição), (d) dicionário de palpites.
  Divergência entre essas quatro é a dívida técnica nº 1 da feature.
- **RNF2 — Categoria mora em `products`.** Coluna `category text NOT NULL DEFAULT 'outros'` + `CHECK (category IN (...))`.
  **Não** enum nativo (design.md do app já cravou: evoluir enum no PG dói; `lists.status` segue text+CHECK). Herda o
  escopo `user_id` de `products` de graça.
- **RNF3 — Sem snapshot; histórico regruça retroativamente.** Categoria é identidade organizacional do produto
  (igual a `display_name`), não fato financeiro. Mudar a categoria de um produto reflete no passado — aceitável e
  desejável (catálogo pessoal), muda **zero dinheiro** (total é `reduce` global, independe de ordem/seção). Contraste
  com preço (que É snapshot em `list_items` por ser registro financeiro imutável, RF14 da Sprint 1).
- **RNF4 — Anti-IDOR da escrita** reancorado em `products.user_id` (padrão de `getUserProduct`/`setItemPrice`):
  `UPDATE products SET category WHERE id=? AND user_id=? AND deleted_at IS NULL RETURNING id` → `false` em 0 linhas.
  **Sem** gate de "lista ativa" (editar categoria PODE tocar histórico, ao contrário de preço/qtd). Valida a
  categoria recebida contra a união no servidor antes do UPDATE.
- **RNF5 — Agrupamento no cliente.** `getItemsForList` passa a retornar `category`; o array segue plano, as seções
  são derivadas no render. Progresso X/Y e total continuam **globais** (não por seção).

## 3. Auto-categorização

- **RF1** — QUANDO um produto é criado, O SISTEMA DEVE gravar o palpite de categoria (dicionário por nome
  normalizado, reusando `normalizeProductName`); sem palpite → `'outros'`.
- **RF2** — QUANDO um produto já existente é re-adicionado (merge `onConflictDoUpdate`), O SISTEMA DEVE preservar a
  categoria atual — o `set` do conflito NÃO toca `category` (senão apaga o override do usuário).

## 4. Edição de categoria

- **RF3** — QUANDO o usuário troca a categoria de um item, O SISTEMA DEVE persistir no **produto** (todas as listas
  futuras herdam), via server action + `revalidatePath`, escopado por dono e validado contra a união.
- **RF4** — QUANDO a categoria muda, O SISTEMA DEVE mover o item para a nova seção e reordenar as seções.
- **RF5** — O controle de trocar categoria DEVE ser um alvo de toque próprio (≥44px), distinto do toggle-comprado e
  do remover; abri-lo NÃO DEVE disparar `onToggle`/`onRemove` da mesma linha (sem bubbling).

## 5. Agrupamento e render

- **RF6** — QUANDO a lista tem itens, O SISTEMA DEVE agrupá-los por categoria, ordenar as **seções** pela sequência
  de corredor e os **itens** dentro de cada seção por `createdAt` (ordem estável — não reordena ao marcar/editar).
- **RF7** — QUANDO uma seção fica sem itens, O SISTEMA DEVE não renderizar seu cabeçalho (e sumir na hora ao remover
  o último item, otimista).
- **RF8** — QUANDO um item é marcado como comprado, O SISTEMA DEVE mantê-lo na mesma seção/posição, mudando só o
  visual (concluído).
- **RF9** — O progresso "no carrinho" X/Y e o total DEVEM ser da lista inteira (globais), não por seção.
- **RF10** — QUANDO há uma única seção ou um único item, O SISTEMA DEVE manter layout coerente (não parecer erro).
- **RF11** — O cabeçalho de seção DEVE ser renderizado fora do `ListItem` (não herdar/quebrar as bordas da "Opção B").

## 6. Entrada em lote e leitura

- **RF12** — QUANDO um item é adicionado (form, sugestão, "mais consumido", "repetir última"), O SISTEMA DEVE
  exibi-lo já na seção correta após o `revalidatePath` (add é server-driven, sem estado "sem categoria").
- **RF13** — QUANDO "repetir última" ou "mais consumidos" trazem itens, O SISTEMA DEVE agrupá-los pelas categorias
  **atuais** dos produtos (não pelas da compra antiga).
- **RF14** — QUANDO o usuário abre uma compra concluída, O SISTEMA DEVE agrupá-la por categoria (atual do produto),
  em somente-leitura, sem controle de troca.

## 7. Backfill dos produtos existentes

- **RF15** — Produtos já existentes sem categoria DEVEM receber `'outros'` na migração (DEFAULT), permanecendo
  editáveis. (Ver decisão D1 sobre backfill opcional pelo dicionário.)

## 8. Decisões abertas (precisam do seu ok no gate)

- **D1 — Backfill dos produtos antigos.** (a) Simples: todos viram `'outros'` e você corrige conforme usa
  (recomendado v1, zero operação extra); (b) eu escrevo um script one-off que roda o dicionário e categoriza seu
  acervo de uma vez. Qual?
- **D2 — Conjunto de categorias + ordem de corredor** (proposta): `hortifruti · padaria · acougue · laticinios ·
  mercearia · bebidas · congelados · limpeza · higiene · outros`. Ajusta algo? (é constante em código, fácil mudar)
- **D3 — Histórico agrupado** por categoria atual, read-only (recomendado — consistente com RNF3). Confirma?
