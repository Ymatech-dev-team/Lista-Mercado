# Requirements — Preço & Orçamento

Sprint 1 do roadmap de enriquecimento do Meu Mercado. Fonte da verdade do **o quê**
(não do como — isso é o `design.md`). Requisitos em EARS PT-BR; cada um é critério de aceite testável.

Validado por painel adversarial (arquiteto · jornada · segurança/dinheiro) em 2026-09-01.

---

## 1. Visão

Dar ao usuário controle de **dinheiro** na lista de mercado: preço por item, total ao vivo,
gasto do mês, comparação com compras anteriores, preço lembrado do histórico e um teto mensal
opcional. Escopo desta sprint **não** inclui: categorias/corredor (Sprint 2), scanner/nota fiscal,
multi-moeda, cotação entre mercados.

## 2. Princípios inegociáveis (RNF)

- **RNF1 — Dinheiro é inteiro em centavos.** Nunca `float`/`numeric` no cálculo. Schema, soma e
  média em centavos inteiros; formatação `R$` só na borda de apresentação.
- **RNF2 — NULL ≠ 0.** "Item sem preço" é `unit_price_cents IS NULL` e é diferente de "R$ 0,00".
  Proibido `DEFAULT 0` (envenena o total silenciosamente).
- **RNF3 — Anti-IDOR sem exceção.** Toda **escrita** de preço usa `ownedByUser(userId)` e retorna
  404 se não é do dono (espelha `setItemQuantity`, `list-items.ts:48-56`). Toda **leitura/agregação**
  de preço/gasto reancora em `lists.userId` via innerJoin (padrão de `getMostConsumed`/`getCoBoughtProducts`).
- **RNF4 — Validação no servidor.** Preço validado com zod em centavos: `int().min(0).max(9_999_999)`
  (teto R$ 99.999,99), **rejeitando** inválido — sem `.catch(default)` silencioso.
- **RNF5 — Agregação parametrizada.** Todo valor dinâmico entra por `${}` do template `sql`; nunca
  `sql.raw` com input; sem concatenação de string em `date_trunc`.
- **RNF6 — CSRF.** Se via Route Handler, replicar `originOk`; Server Action é preferível (CSRF do framework).
- **RNF7 — LGPD.** `/api/export` passa a incluir preço por item, total por lista e teto mensal, mantendo escopo por `userId`.
- **RNF8 — Sem read-modify-write de dinheiro.** Preço e quantidade em UPDATEs de coluna única; total
  sempre calculado on-read (`SUM(quantity * unit_price_cents)`), nunca denormalizado e reescrito pela app.

## 3. Preço por item

- **RF1** — QUANDO o usuário informa o preço unitário de um item da lista ativa, O SISTEMA DEVE
  armazenar o valor em centavos inteiros e passar a exibir o subtotal = preço × quantidade.
- **RF2** — QUANDO um item ainda não tem preço informado, O SISTEMA DEVE exibir "—" na linha (não
  "R$ 0,00"); e QUANDO o usuário informa 0 explicitamente, O SISTEMA DEVE aceitar como preço válido
  e distinto de "sem preço".
- **RF3** — QUANDO o usuário digita o preço no celular, O SISTEMA DEVE apresentar teclado numérico
  (`inputMode="decimal"`), aceitar vírgula como separador decimal, assumir centavos e exibir formatado como "R$ 0,00".
- **RF4** — QUANDO o usuário informa preço negativo, não numérico ou acima do teto de sanidade
  (R$ 99.999,99), O SISTEMA DEVE rejeitar a entrada e manter o último preço válido, sem quebrar o total.
- **RF5** — QUANDO o usuário altera a quantidade de um item que já tem preço, O SISTEMA DEVE recalcular
  imediatamente o subtotal e o total da lista no cliente, sem esperar o servidor.
- **RF6** — QUANDO o usuário adiciona um produto que já está na lista (merge que soma quantidade), O
  SISTEMA DEVE manter o preço unitário já informado e NÃO DEVE zerá-lo nem substituí-lo; se não havia
  preço, permanece sem preço.
- **RF7** — QUANDO o usuário dispara duas edições de preço do mesmo item em sequência rápida, O SISTEMA
  DEVE tratar como idempotente (estado desejado absoluto, último valor vence), sem duplicar efeitos.

## 4. Resiliência offline (fila de reenvio)

- **RF8** — QUANDO o usuário edita o preço de um item e a requisição falha por rede/timeout/5xx/401, O
  SISTEMA DEVE enfileirar a edição no localStorage e reenviá-la ao reconectar (mesmo padrão de `purchased`),
  preservando a edição em vez de só reverter.
- **RF9** — QUANDO o usuário altera a quantidade offline, O SISTEMA DEVE enfileirar a nova quantidade e
  reenviá-la ao reconectar (fecha buraco pré-existente: hoje `changeQty` só reverte), porque preço × quantidade depende dela.
- **RF10** — QUANDO a página recarrega e há preço/quantidade pendente na fila para um item, O SISTEMA DEVE
  preservar o valor local pendente sobre o do servidor (estender `reconcile`) até o reenvio confirmar.
- **RF11** — QUANDO o usuário remove um item que tinha preço e usa "Desfazer", O SISTEMA DEVE restaurar
  também o preço informado (incluir preço no payload de restauração).

## 5. Total ao vivo

- **RF12** — QUANDO existe na lista ativa ao menos um item sem preço, O SISTEMA DEVE somar esse item como 0
  no total ao vivo E sinalizar visualmente que o total é **parcial/projeção** (não confundir com preço final).
- **RF13** — O total da lista DEVE ser calculado on-read a partir dos subtotais, nunca lido de um campo
  denormalizado reescrito pela aplicação.

## 6. Histórico imutável (snapshot)

- **RF14** — QUANDO o usuário conclui a compra, O SISTEMA DEVE gravar o snapshot do preço unitário e da
  quantidade de cada item, de forma que alterações posteriores em preço/quantidade/nome do produto NÃO
  alterem o total histórico registrado.
- **RF15** — QUANDO o usuário abre uma lista já concluída, O SISTEMA DEVE exibir preços em somente-leitura
  e NÃO DEVE permitir editar preço, quantidade ou marcação de comprado.
- **RF16** — QUANDO o usuário conclui uma compra com itens sem preço, O SISTEMA DEVE avisar/confirmar que o
  total registrado ficará subestimado, pois o snapshot será congelado naquele momento.
- **RF17** — QUANDO o usuário usa "Repetir última compra", O SISTEMA DEVE recriar os itens SEM copiar o preço
  congelado como preço definitivo; no máximo oferecê-lo como "preço lembrado" sujeito a confirmação.

## 7. Gasto por mês

- **RF18** — QUANDO o usuário abre o painel de gasto, O SISTEMA DEVE exibir o total gasto no mês corrente =
  `SUM(quantity * unit_price_cents)` de itens comprados em listas concluídas no mês, escopado por `userId`.
- **RF19** — O mês de atribuição de uma compra DEVE ser o mês de `lists.completedAt` **no fuso do usuário**
  (`America/Sao_Paulo`), de forma estável — corrigindo o `date_trunc` em UTC hoje presente em
  `getItemsPurchasedThisMonth` (`lists.ts:52-66`), que joga compras do fim do mês à noite pro mês seguinte.

## 8. Comparação com compras anteriores

- **RF20** — QUANDO existe pelo menos uma compra concluída anterior, O SISTEMA DEVE comparar o total desta
  lista com a última concluída (e/ou a média das N recentes).
- **RF21** — A comparação DEVE ser concluída-vs-concluída; o total de uma lista **ativa** só pode aparecer
  rotulado como "projeção parcial", nunca comparado de igual pra igual com uma concluída.
- **RF22** — QUANDO uma lista tem cobertura parcial de preço (X de Y itens com preço), O SISTEMA DEVE
  explicitar essa cobertura junto do total, para a comparação não enganar.
- **RF23** — QUANDO não há base anterior, O SISTEMA DEVE exibir estado vazio ("sem comparação disponível"),
  sem variação de 0% nem divisão por zero.

## 9. Preço lembrado

- **RF24** — QUANDO existe preço lembrado para um produto, O SISTEMA DEVE derivá-lo do snapshot da última
  compra concluída daquele produto (não do preço editável da lista ativa), escopado por `userId`.
- **RF25** — QUANDO o usuário adiciona um produto pela primeira vez (sem histórico de preço), O SISTEMA DEVE
  omitir o preço lembrado (estado neutro), sem sugerir 0 ou placeholder enganoso.

## 10. Orçamento-teto mensal (opcional, versão simples)

- **RF26** — O usuário DEVE poder definir um teto de gasto mensal opcional (um valor em centavos no perfil).
- **RF27** — QUANDO não há teto definido, O SISTEMA DEVE exibir o gasto do mês normalmente, sem qualquer alerta.
- **RF28** — QUANDO o gasto do mês está abaixo do teto, O SISTEMA DEVE exibir o progresso em estado neutro/positivo.
- **RF29** — QUANDO o gasto do mês atinge o percentual de alerta (≥ 80% do teto), O SISTEMA DEVE sinalizar a
  aproximação, sem bloquear novas adições.
- **RF30** — QUANDO o gasto do mês ultrapassa o teto, O SISTEMA DEVE sinalizar o estouro claramente e NÃO DEVE
  impedir adicionar itens ou concluir a compra (teto é informativo, não trava).

## 11. Decisões de arquitetura recomendadas pelo painel (viram ADR no design.md)

- **ADR-1** — Preço = **snapshot** em `list_items.unit_price_cents integer NULL` + `CHECK (>= 0)`. Não no
  catálogo (preço muda toda semana; catálogo reescreveria o passado).
- **ADR-2** — Preço lembrado = **derivar** do histórico (`DISTINCT ON (product_id) ... ORDER BY completed_at DESC`).
  Sem cache no v1; se doer latência, cache em `products.last_price_cents` atualizado **só** no `completeActiveList`.
- **ADR-3** — **Não** adicionar `addedByUserId` agora (YAGNI). Compartilhamento (Sprint 4) é refactor de
  autorização, não uma coluna; `list_items.createdAt` já reconstrói ordem/tempo. Reverte a sugestão do contrato.
- **ADR-4** — Fuso fixo `America/Sao_Paulo` no v1 (corrige o bug latente de fronteira de mês). Guardar fuso no
  perfil fica para depois.
- **ADR-5** — Teto = coluna `users.monthly_budget_cents integer NULL` (não tabela por mês) no v1.

## 12. Decisões (resolvidas com o JP em 2026-09-01)

- **D1 — RESOLVIDO: não** incluir `addedByUserId` agora (acatada a reprovação do painel). Ver ADR-3.
- **D2 — RESOLVIDO: autofill editável.** QUANDO existe preço lembrado, O SISTEMA DEVE pré-preencher o campo
  de preço com esse valor de forma **editável** (o usuário confirma implicitamente ou altera), em vez de só
  sugerir num chip. O estado "sem histórico" (RF25) continua vazio.
- **D3 — RESOLVIDO: sim.** Gasto do mês = só listas concluídas; lista ativa aparece como "projeção parcial" à parte.
- **D4 — RESOLVIDO: sim.** Corrigir o bug de fuso em `getItemsPurchasedThisMonth` nesta sprint (RF19).
