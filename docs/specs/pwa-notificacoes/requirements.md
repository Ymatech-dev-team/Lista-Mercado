# Requirements — PWA + lembretes de recompra (v1)

Sprint 3 do roadmap. EARS PT-BR. Validado por painel (arquiteto + jornada) e ancorado nos docs desta versão do
Next (`node_modules/next/dist/docs/01-app/02-guides/offline-support.md`, `.../functions/use-offline.md`, `manifest.md`).

## 1. Visão e escopo

Meu Mercado **instalável no celular**, **tolerante a quedas de conexão** no mercado, e com **lembretes de
recompra in-app** derivados do histórico. Sem push real (com app fechado) nesta sprint.

**Fora de escopo:** push/VAPID/cron (Sprint 3.5); navegação 100% offline de dados frescos (SSR precisa de rede);
habilitar `cacheComponents` (mudança invasiva — usamos `loading.tsx`).

## 2. ADRs (decisões de arquitetura)

- **ADR-1 — Offline em-sessão via `experimental.useOffline`** (nativo do Next 16). Navegação/RSC/Server Action que
  falham por rede ficam **pendentes e reenviam ao reconectar** (não lançam). O hook `useOffline()` (`next/offline`)
  alimenta o banner. A fila `mm:pending` (marcar/qtd/preço via `PUT /api/items/*`) **permanece** — `fetch()` direto
  em client component fica fora do `useOffline`, então as duas coisas são complementares.
- **ADR-2 — `loading.tsx`, NÃO `cacheComponents`.** O guia usa Cache Components pro App Shell, mas sem ele um
  `loading.tsx` por rota dá o mesmo comportamento offline. Ligar Cache Components é grande demais pro v1.
- **ADR-3 — Manifest via `app/manifest.ts`** (`MetadataRoute.Manifest`, estático/cacheável). Ícones do mascote do
  carrinho (192, 512, 512 maskable) + `app/icon.png`/`apple-icon.png`.
- **ADR-4 — Service worker MÍNIMO e SEGURO** (só pra cold-start offline + instalabilidade): precache só casca
  estática + `/offline`; **network-first na navegação**; nome de cache **versionado por build** (limpa antigos no
  `activate`); **nunca cachear dado autenticado** (RSC/`/api/items/*` — multiusuário); fluxo **"nova versão →
  recarregar"** (sem `skipWaiting` silencioso). Registro client-side. (Ver D2.)
- **ADR-5 — Lembretes computados do histórico, SEM tabela nova.** `getRepurchaseReminders(userId)` espelha
  `getMostConsumed`: `list_items` comprados × `lists.completedAt`, escopo `lists.userId`, `isNull(deletedAt)`.
  Dias no fuso `America/Sao_Paulo` (reusa `thisMonthSP`). Sharing-safe (nenhuma tabela chaveada em userId).
- **ADR-6 — Dispensar/adiar lembrete em localStorage** (por-dispositivo; sem banco). "Dispensar até a próxima
  compra" auto-reseta quando o produto é comprado; "adiar" = `snooze-until`.

## 3. Instalação (PWA)

- **RF1** — QUANDO o navegador dispara `beforeinstallprompt` (Android/Chrome), O SISTEMA DEVE exibir um convite
  "Instalar" que chama o prompt nativo no clique.
- **RF2** — QUANDO o usuário está no iOS/Safari (sem o evento), O SISTEMA DEVE mostrar instrução manual
  ("Compartilhar → Adicionar à Tela de Início").
- **RF3** — QUANDO o app já roda instalado (`display-mode: standalone`), O SISTEMA DEVE NÃO exibir o convite.
- **RF4** — QUANDO o usuário dispensa o convite, O SISTEMA DEVE suprimi-lo por um período (≥30 dias, flag em
  localStorage), sem reexibir a cada visita.
- **RF5** — QUANDO o navegador não suporta instalação, O SISTEMA DEVE ocultar o convite sem erro.
- **RF6** — O app DEVE ser instalável: manifest válido com `name`, `short_name`, `icons` (192+512+maskable),
  `display: "standalone"`, `start_url`, `theme_color`/`background_color`.

## 4. Offline

- **RF7** — QUANDO uma navegação/Server Action falha por falta de rede, O SISTEMA DEVE mantê-la pendente e
  reenviá-la ao reconectar (via `experimental.useOffline`), sem erro cru nem perda silenciosa.
- **RF8** — QUANDO o app está offline, O SISTEMA DEVE exibir um banner persistente ("sem conexão — pendências
  reenviam ao voltar"), sumindo ao reconectar (`useOffline()`).
- **RF9** — QUANDO uma Server Action está pendente offline, O SISTEMA DEVE refletir estado de carregando no
  controle que a disparou (ex.: rótulo "salvando (offline)…"), não um clique morto.
- **RF10** — A fila `mm:pending` (marcar comprado/quantidade/preço) DEVE continuar funcionando offline e drenar ao
  reconectar (comportamento atual preservado).
- **RF11** — QUANDO o app instalado é aberto sem rede (cold-start), O SISTEMA DEVE servir a casca cacheada ou uma
  página `/offline`, nunca tela branca. (Depende do SW — D2.)
- **RF12** — QUANDO uma nova versão é publicada com um SW antigo ativo, O SISTEMA DEVE detectar o novo SW e
  oferecer "atualizar/recarregar", evitando servir HTML/chunks obsoletos (network-first na navegação).
- **RF13** — O SW NÃO DEVE cachear respostas autenticadas (RSC por usuário, `/api/items/*`); no logout/troca de
  conta, nenhum dado de outro usuário pode persistir em cache.

## 5. Lembretes de recompra

- **RF14** — QUANDO um produto foi comprado em ≥2 listas concluídas distintas, O SISTEMA DEVE calcular o intervalo
  médio entre compras (deltas de `completedAt`, fuso SP) e, QUANDO os dias desde a última > intervalo médio ×
  fator, gerar um lembrete.
- **RF15** — QUANDO o produto tem <2 compras (sem intervalo), O SISTEMA DEVE NÃO gerar lembrete.
- **RF16** — QUANDO o produto já está na lista ativa, O SISTEMA DEVE suprimir o lembrete dele.
- **RF17** — QUANDO o produto foi comprado há muito tempo além do padrão (dias desde a última > intervalo × teto de
  abandono K), O SISTEMA DEVE NÃO gerar lembrete (não "nagar" item abandonado).
- **RF18** — QUANDO a cadência é muito irregular (alta variância), O SISTEMA DEVE rebaixar/omitir o lembrete.
- **RF19** — QUANDO há muitos produtos vencidos, O SISTEMA DEVE limitar a um top N (ex.: 3–5), ordenado por atraso
  relativo.
- **RF20** — QUANDO o usuário toca num lembrete, O SISTEMA DEVE adicioná-lo à lista ativa (reusa `quickAddAction`)
  e removê-lo da vista.
- **RF21** — QUANDO o usuário dispensa/adia um lembrete, O SISTEMA DEVE ocultá-lo (dispensar = até a próxima compra;
  adiar = `snooze-until`), persistido em localStorage.
- **RF22** — QUANDO o produto/lista está soft-deleted, O SISTEMA DEVE excluí-lo do cálculo.
- **RF23** — Os lembretes aparecem na **Home** (`/inicio`), ao lado de "você sempre compra".

## 6. Decisões abertas (precisam do seu ok)

- **D1 — Ligar `experimental.useOffline`** (flag experimental do Next 16). É a forma documentada de offline nesta
  versão e casa exato com o caso. Risco: é "experimental" (pode mudar em versões futuras do Next; pinamos a versão).
  *Recomendo ligar.* (E NÃO ligar `cacheComponents` — uso `loading.tsx`.)
- **D2 — Service worker mínimo agora, ou depois?** (a) *Recomendo* incluir o SW mínimo-seguro (instalabilidade
  robusta no Android + cold-start offline + `/offline`), com todas as travas do ADR-4. (b) Adiar o SW: fica
  instalável no iOS e offline em-sessão via `useOffline`, mas sem cold-start offline e com instalação menos
  garantida no Android. 
- **D3 — Dispensar lembrete em localStorage** (por-dispositivo, sem banco). *Recomendo.* Alternativa (tabela) fica
  pra quando houver "espaço/casa" (Sprint 4).
