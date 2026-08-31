# Tasks — Meu Mercado (MVP)

> Ordem por dependência. Cada escopo fecha e **PARA** para review (3 lentes) + seu "ok" antes do próximo.
> Nada de commit/SQL sem seu ok explícito. Gerado contra [requirements.md](requirements.md) e [design.md](design.md).

## Legenda
`[ ]` a fazer · cada task diz o **teste** que a prova · 🔴 = você (JP) faz com a própria mão (banco/conta).

---

## Escopo 0 — Fundação (o esqueleto que sobe)
Objetivo: um app Next.js vazio, no ar, conectado ao Neon. Nenhuma feature ainda — só a base de pé.

- [x] T0.1 — `git init` + remote `Ymatech-dev-team/Lista-Mercado`, branch `develop`. ✓ remote conectado.
- [x] T0.2 — Scaffold Next.js 16 (App Router) + TypeScript + Tailwind v4. ✓ `npm run build` passa.
- [x] T0.3 — Deps de base: Drizzle + `@neondatabase/serverless` + `drizzle-kit`. ✓ build ok.
- [x] 🔴 T0.4 — Projeto Neon criado; 2 connection strings no `.env` (corrigida a direct que veio com `-pooler`). ✓
- [x] 🔴 T0.5 — SQL do design.md §6 rodado no Neon. ✓ verificação retornou as 7 tabelas.
- [x] T0.6 — Schema Drizzle das 7 tabelas (`src/db/schema.ts`) + cliente neon-http (`src/db/index.ts`). ✓ health-check conectou (7 tabelas, pooled+direct).
- [x] T0.7 — `.env.example` + `.gitignore` (`.env` ignorado; nenhum `NEXT_PUBLIC_`). ✓
- [ ] 🔴 T0.8 — Deploy inicial na **Vercel** conectada ao repo (hello world). **Teste:** URL da Vercel abre o app. ⏳ com o JP.
- [x] Review do escopo (direta, por ser config; commit `6d823be` + push em `develop`). ✓
- Falta só T0.8 (Vercel) pra fechar o escopo.

## Escopo 1 — Design-system base (tokens + componentes)
Objetivo: os componentes do §9 existindo e visíveis nos 2 temas, antes de montar telas.

- [x] T1.1 — CSS variables light/dark + fontes (Familjen/Hanken/DM Mono) + toggle (next-themes). ✓ validado no navegador nos 2 temas.
- [x] T1.2 — Componentes-núcleo (§9.5): Button, Input, Checkbox, ListItem, Chip, Card, BottomNav, EmptyState, Toaster (sonner), ConfirmDialog (Radix), Progress — com estados. ✓ vitrine em `/ui`.
- [x] T1.3 — Contraste AA + a11y revisados por painel (a11y/design + code-review). ✓
- [x] Review do escopo (a11y/design + code-review adversariais); achados corrigidos (type=button, número ≥14px, erro com ícone+msg, verde contido, alvos ≥44px, radius, pressed). Build ✓.
- Pronto pra commit (aguardando ok do JP).

## Escopo 2 — Autenticação (a mais sensível — vai devagar)
> Divido em 2a e 2b porque é a parte perigosa. Cada metade revisa com foco de **segurança**.

**2a — Cadastro + verificação de e-mail** ✅ construído, testado no navegador + banco, revisado por AppSec.
- [ ] 🔴 T2.1 — Você cria contas **Resend** + **Upstash** e põe as chaves no `.env`. ⏳ (dev roda sem elas: e-mail cai no console, rate limit é no-op).
- [x] T2.2 — Cadastro: form + hash argon2id (`runtime='nodejs'`), grava consentimento, e-mail único. ✓ senha guardada como `$argon2id`; anti-enumeração (resposta idêntica + e-mail apropriado); rate limit (Upstash, fail-closed em prod).
- [x] T2.3 — Verificação: token só-hash single-use atômico + envio (Resend/console); confirma por POST (não GET). ✓ testado ponta a ponta.

> **Dívida de segurança — pré-produção (do laudo AppSec):**
> - 🔴 Ativar o rate limit de verdade (criar Upstash + chaves no `.env`/Vercel) — hoje é no-op em dev.
> - 🟠 Expirar contas não-verificadas (anti-squatting) + **bloquear login de conta não-verificada** (fecha no 2b).
> - 🟡 Rotacionar a credencial do Neon antes de prod; segredos só nos env da Vercel.

**2b — Login + sessão + reset** ✅ construído, testado ao vivo, revisado por AppSec.
- [x] T2.4 — Login timing-safe (dummy hash), mensagem genérica, rate limit (IP seguro `x-real-ip` + conta), gate de e-mail não-verificado. ✓
- [x] T2.5 — Sessão: token opaco → `sha256` no banco, cookie `__Host-` (prod) httpOnly/Secure/Lax, rotação no login, deslizante+absoluta. ✓ logout revoga no servidor (sessões=0).
- [x] T2.6 — Reset: token só-hash single-use atômico, expira 30min, derruba todas as sessões, resposta idêntica (anti-enum). ✓ testado ponta a ponta.
- [x] Review AppSec do 2b: núcleo aprovado; corrigidos HSTS+headers (`next.config.ts`), IP anti-spoof (`x-real-ip`), cookie maxAge = teto absoluto. Headers confirmados na resposta.

> **Dívida de segurança — pré-produção (atualizada):**
> - 🔴 Ativar Upstash de verdade (chaves) — hoje no-op em dev, fail-closed em prod.
> - 🟠 Expirar contas não-verificadas (anti-squatting).
> - 🟡 Rotacionar credencial do Neon; timing residual no "esqueci senha" (mitigado por rate limit); CSP completa; verificar senha vazada (HIBP).

## Escopo 3 — Listas + itens (o coração)
- [x] T3.1 — Criar lista (auto, 1 ativa via índice único parcial, idempotente). ✓ testado.
- [x] T3.2 — Adicionar item: produto canônico (normalização no código, acento-insensível), merge de quantidade. ✓ "Arroz"+"arroz" = 1 item qty 3.
- [x] T3.3 — Marcar otimista (Route Handler PUT + Origin, fila localStorage com timeout/AbortController, sessão expirada preservada). ✓ testado.
- [x] T3.4 — Remover com desfazer; produto sobrevive à remoção. ✓ (Leite continua no catálogo).
- [x] **App shell responsivo** (feedback do JP): barra lateral no desktop, abas na base no celular; claro + escuro. ✓ testado nas 2 telas/temas.
- [x] Review do escopo (code-review + security-review adversariais). Corrigidos: IDOR de produto no restore, escopo de `getItemsForList`, validação de entrada do restore, e os 3 bugs de resiliência da fila (race, timeout, 401). Build ✓.
- Pronto pra commit (aguardando ok). Painel lateral "mais consumidos" no desktop → vem no Escopo 5.

## Escopo 4 — Concluir + histórico
- [ ] T4.1 — Concluir lista: `UPDATE ... WHERE status='active'` atômico (idempotente), imutável. **Teste:** concluir 2x = 1 registro; lista vazia não conclui.
- [ ] T4.2 — Histórico: lista das concluídas (desc), abrir em leitura, empty state. **Teste:** não dá pra editar o passado; vazio mostra CTA.
- [ ] Review do escopo + seu ok.

## Escopo 5 — Home "mais consumidos"
- [ ] T5.1 — Query de agregação (§6): top 10, comprados, 90 dias, por usuário. **Teste:** ranking bate com a definição.
- [ ] T5.2 — Home: saudação + chips de mais-consumidos + ação rápida (adicionar à lista ativa, idempotente) + empty state (<3 concluídas). **Teste:** usuário novo vê empty; ação rápida adiciona 1.
- [ ] Review do escopo + seu ok.

## Escopo 6 — Acabamento + fechamento
- [ ] T6.1 — LGPD: excluir conta em cascata + export JSON. **Teste:** excluir some com tudo; export sai.
- [ ] T6.2 — Segurança de borda: HSTS, checagem final de segredos, nenhum `console.log` de senha. **Teste:** security-review final passa.
- [ ] T6.3 — `/analyze` de consistência: todo RF/RNF tem cobertura. **Teste:** nenhum requisito órfão.
- [ ] Review final (3 lentes) + seu ok + deploy prod.

---

## Escopos aprováveis (cada um fecha e PARA)
0. **Fundação** — T0.* — setup/infra 🔴 (você toca banco/contas)
1. **Design-system** — T1.* — front base
2. **Auth** — T2.* (2a depois 2b) — backend+front sensível
3. **Listas + itens** — T3.*
4. **Concluir + histórico** — T4.*
5. **Home** — T5.*
6. **Acabamento** — T6.*
