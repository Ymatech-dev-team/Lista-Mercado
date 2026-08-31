# Tasks — Meu Mercado (MVP)

> Ordem por dependência. Cada escopo fecha e **PARA** para review (3 lentes) + seu "ok" antes do próximo.
> Nada de commit/SQL sem seu ok explícito. Gerado contra [requirements.md](requirements.md) e [design.md](design.md).

## Legenda
`[ ]` a fazer · cada task diz o **teste** que a prova · 🔴 = você (JP) faz com a própria mão (banco/conta).

---

## Escopo 0 — Fundação (o esqueleto que sobe)
Objetivo: um app Next.js vazio, no ar, conectado ao Neon. Nenhuma feature ainda — só a base de pé.

- [ ] T0.1 — `git init` aqui + conectar remote `Ymatech-dev-team/Lista-Mercado`, branch `develop`. **Teste:** `git remote -v` aponta certo.
- [ ] T0.2 — Scaffold Next.js (App Router) + TypeScript + Tailwind v4. **Teste:** `npm run build` passa; `npm run dev` abre a home padrão.
- [ ] T0.3 — Instalar deps de base: Drizzle + `@neondatabase/serverless` + `drizzle-kit`. **Teste:** `npm run build` continua passando.
- [ ] 🔴 T0.4 — Você cria o projeto no **Neon** (branch de dev) e me passa as 2 connection strings (pooled + direct). **Teste:** consigo listar tabelas (vazio).
- [ ] 🔴 T0.5 — Você roda o **SQL do design.md §6** no Neon (dev). Eu só te entrego o bloco; você cola. **Teste:** query de verificação lista as 8 tabelas.
- [ ] T0.6 — Schema Drizzle espelhando as 8 tabelas + camada `db/` (data-access) com helper que exige `userId`. **Teste:** um script de leitura conecta e retorna vazio sem erro.
- [ ] T0.7 — `.env.example` + `.gitignore` (nunca versionar `.env`; nenhum segredo `NEXT_PUBLIC_`). **Teste:** `git status` não vê `.env`.
- [ ] 🔴 T0.8 — Deploy inicial na **Vercel** conectada ao repo (só o hello world). **Teste:** URL da Vercel abre o app.
- [ ] Review do escopo + seu ok.

## Escopo 1 — Design-system base (tokens + componentes)
Objetivo: os componentes do §9 existindo e visíveis nos 2 temas, antes de montar telas.

- [ ] T1.1 — CSS variables light/dark (§9.2/9.3) + fontes (Familjen/Hanken/DM Mono) + toggle de tema. **Teste:** trocar tema muda tudo; body pinta bg do token.
- [ ] T1.2 — Componentes-núcleo (§9.5): Botão, Input (texto/numérico), Item-da-lista, Chip, Card, Bottom-nav, Empty state, Toast, Modal de confirmação, Progress — com estados `focus-visible`/`pressed`/`disabled`/`loading`/`error`. **Teste:** página `/ui` mostra todos; foco por teclado visível; alvos ≥44px.
- [ ] T1.3 — Checagem de contraste AA nos 2 temas na página `/ui`. **Teste:** revisão a11y aprova.
- [ ] Review do escopo (design + a11y) + seu ok.

## Escopo 2 — Autenticação (a mais sensível — vai devagar)
> Divido em 2a e 2b porque é a parte perigosa. Cada metade revisa com foco de **segurança**.

**2a — Cadastro + verificação de e-mail**
- [ ] 🔴 T2.1 — Você cria contas **Resend** (e-mail) e **Upstash** (rate limit) e me passa as chaves (via `.env`, nunca no chat). 
- [ ] T2.2 — Cadastro: form + hash argon2id (`runtime='nodejs'`), grava `consent_at`/`privacy_version`, e-mail único. **Teste (falha primeiro):** senha nunca em texto no banco; e-mail duplicado rejeitado.
- [ ] T2.3 — Verificação de e-mail: token hasheado single-use + envio Resend; conta só ativa após confirmar. **Teste:** link expira/uso único; conta não-verificada não loga.

**2b — Login + sessão + reset**
- [ ] T2.4 — Login: timing-safe (hash dummy p/ e-mail inexistente), mensagem genérica, rate limit Upstash (IP+conta). **Teste:** e-mail inexistente não vaza por tempo; 6ª tentativa dá 429.
- [ ] T2.5 — Sessão: token opaco → `sha256` no banco, cookie `__Host-`, rotação no login, deslizante+absoluta. **Teste:** logout encerra no servidor; sessão não some ao logar em outro device.
- [ ] T2.6 — Reset de senha: token hasheado single-use atômico, expira 15–30min, derruba sessões, msg igual p/ e-mail inexistente. **Teste:** token velho não funciona pós-reset.
- [ ] Review do escopo (code + **security** + a11y) + seu ok.

## Escopo 3 — Listas + itens (o coração)
- [ ] T3.1 — Criar lista (1 ativa via índice único; idempotente). **Teste:** duplo clique = 1 lista; F5 recupera.
- [ ] T3.2 — Adicionar item: produto canônico (normalização no código), merge por nome, `CHECK(quantity>0)`. **Teste:** "Leite"+"leite " = 1 item somado; qty 0 vira 1.
- [ ] T3.3 — Marcar item **otimista** (Route Handler PUT + Origin check, fila localStorage, não reverte em falha de rede). **Teste:** pinta ≤200ms; net cai e volta → persiste sem reclique; marcar 3x = 1 estado.
- [ ] T3.4 — Remover item com **desfazer** (toast undo); item removido não apaga o produto. **Teste:** undo restaura; produto continua.
- [ ] Review do escopo (code + a11y/resiliência) + seu ok.

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
