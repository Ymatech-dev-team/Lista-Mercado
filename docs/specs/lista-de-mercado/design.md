# Design — Meu Mercado (Fase 2A: Arquitetura & Dados)

> O COMO. Gerado contra o [requirements.md](requirements.md) e validado por painel adversarial
> (arquiteto de dados + AppSec + fullstack pragmático) em 2026-08-31.
> A parte de **identidade visual e mockups** é a Fase 2B (documento continua abaixo depois).

---

## 1. Visão de arquitetura

**Stack:** Next.js (App Router) + TypeScript · Neon (Postgres serverless) · Vercel · Drizzle ORM.

**Camadas (fronteiras claras):**
```
UI (React)
  ├─ Server Components  → só LEEM dados (via camada de dados)
  └─ Client Components  → interatividade (marcar item, otimista) — 'use client'
Mutations
  ├─ Server Actions     → operações que navegam/revalidam (criar lista, concluir, adicionar item)
  └─ Route Handlers     → mutation de alta frequência que precisa de retry próprio (marcar item)
Camada de dados (data-access)  → ÚNICO lugar que monta query; toda função recebe userId da SESSÃO
  └─ Drizzle + @neondatabase/serverless (neon-http)
Neon (Postgres)
```

**Regras de runtime (armadilhas de Vercel que quebram em produção):**
- **Todo endpoint que faz hash de senha declara `export const runtime = 'nodejs'`.** No Edge Runtime as APIs de cripto do Node não existem e o hash não roda.
- **Conexão Neon:** usar `drizzle-orm/neon-http` (HTTP stateless, sem pool persistente — casa com serverless). **Nunca** abrir `pg.Pool` TCP dentro de action/handler (estoura o limite de conexões do Neon no primeiro pico).
- **Duas connection strings:** runtime do app usa a **pooled** (com `-pooler`); migrations do Drizzle usam a **direct** (sem `-pooler`; o PgBouncer quebra DDL).
- Transação atômica multi-statement (ex.: upsert de item): usar a API de transação em batch do neon-http.

**Regra anti-IDOR (a fronteira de segurança mais importante):** o `user_id` **sempre** vem da sessão validada no servidor, **nunca** de um parâmetro do cliente. Toda função da camada de dados recebe `(userId, ...)`. Escritas validam posse na própria cláusula: `UPDATE ... WHERE id = ? AND user_id = ?` e conferem `rowCount === 1` (evita TOCTOU).

---

## 2. Modelo de dados

8 tabelas. Rasas e explícitas — sem abstração genérica de "repository".

| Tabela | Papel |
|--------|-------|
| `users` | conta; e-mail + hash de senha + consentimento LGPD |
| `sessions` | sessões opacas server-side (token só como hash) |
| `password_reset_tokens` | fluxo "esqueci a senha" (token só como hash, single-use) |
| `email_verification_tokens` | confirmação de e-mail no cadastro *(se D8 = sim)* |
| `products` | catálogo **canônico por usuário** (nome normalizado) — coração do "mais consumido" |
| `lists` | uma lista; `status` active/completed; máx. 1 ativa por usuário |
| `list_items` | linha da lista; aponta pra `products`; `quantity` + `is_purchased` |

**Decisões de modelagem (barato agora, caro depois):**
- **`timestamptz` em tudo** (nunca `timestamp` — a janela de 90 dias viraria bug de fuso).
- **`text` + `CHECK` no lugar de `ENUM` nativo** para `status` (evoluir enum no Postgres é doloroso).
- **Normalização de nome no código, não no banco** (evita depender de `citext`/`unaccent`): `trim → minúsculas → colapsar espaços → remover acento` (`String.normalize('NFD')...`). Grava em `products.normalized_name`, indexado.
- **`UNIQUE(list_id, product_id)`** em `list_items`: é o que **permite** o "somar quantidade" via `INSERT ... ON CONFLICT ... DO UPDATE`.
- **`UNIQUE(user_id, normalized_name)` parcial** (`WHERE deleted_at IS NULL`) em `products`.
- **`UNIQUE(user_id) WHERE status='active'`** em `lists`: garante "1 ativa por vez" **no banco** (código sozinho tem brecha de corrida). No dia que quiser várias, **derruba o índice** — nada mais muda.
- **Índices de FK explícitos** (Postgres não cria sozinho) + índice composto pra query da Home.
- **Produto = soft-delete** (`deleted_at`); nunca `DELETE` físico (o histórico e o ranking dependem do `product_id`). Consequência consciente: **renomear produto reescreve o passado** — aceitável e desejável aqui (catálogo pessoal). Se renomear colidir com outro `normalized_name`, o MVP **bloqueia** com aviso.
- **Tokens (sessão/reset/verificação): guardar apenas o HASH** (`sha256` do token). O token cru só vai no cookie/e-mail. Vazamento do banco não pode virar sequestro de sessão.

---

## 3. Fluxo (máquina de estados + idempotência + otimista)

### Lista
```
(nenhuma ativa) --criar--> [active] --concluir--> [completed] (imutável, vira histórico)
```
- **Criar:** protegido pelo índice único parcial (2ª lista ativa é recusada pelo banco).
- **Concluir (idempotente):** `UPDATE lists SET status='completed', completed_at=now() WHERE id=? AND user_id=? AND status='active'`. Se `rowCount=0`, já estava concluída → concluir 2x = 1 efeito. **Nunca** checar-status-depois-atualizar em 2 passos (corrida entre abas).

### Item — marcar "peguei" (a zona crítica, RF4)
- **Estado por item, não toggle:** o cliente envia o **estado desejado** (`is_purchased=true`), não "inverte". Reenviar N vezes = mesmo resultado (**idempotente por natureza**).
- **Otimista:** o check pinta na hora (≤200 ms) via `useOptimistic`, antes do servidor.
- **Falha de REDE não reverte.** Só erro **semântico** (4xx: "esse item não é seu") reverte. Falha de transporte (offline/timeout) → mantém pintado e **enfileira reenvio**.
- **Fila de reenvio simples:** um array em `localStorage` (`itemId → estado desejado`). Drena ao voltonline (`window 'online'`) + um `setInterval` leve. Sem service worker, sem IndexedDB, sem CRDT — o escopo de **1 usuário / 1 lista ativa / campo booleano** elimina conflito real.
- **Transporte:** `Route Handler PUT /api/items/:id/purchased` chamado via `fetch` (controla retry/timeout/`AbortController`), **não** Server Action (que não dá controle de rede e reverteria). O handler **valida o header `Origin`** (proteção CSRF, ver §4).

### Adicionar item / ação-rápida da Home
- **Server Action, só-online** (fora da fila de reenvio). Merge por nome normalizado: `INSERT ... ON CONFLICT (list_id, product_id) DO UPDATE SET quantity = list_items.quantity + EXCLUDED.quantity`.
- Duplo clique: botão desabilita no 1º clique (conforto de UX). Como não está na fila offline, o vetor de "retry de rede infla quantidade" **não é exercido** no MVP. *(Upgrade documentado: se um dia adicionar item for offline, introduzir `request_id` como chave de idempotência.)*

### Matriz de idempotência (resumo)
| Ação | Garantia |
|------|----------|
| Criar lista | índice único parcial `WHERE status='active'` (banco recusa a 2ª) |
| Marcar item | estado desejado, não toggle (idempotente por natureza) |
| Concluir lista | `UPDATE ... WHERE status='active'` atômico |
| Adicionar item | só-online + botão desabilitado (vetor de retro não acionado no MVP) |

### Sessão (ciclo de vida)
- **Login:** valida credenciais → **gera token novo** (rotação anti-fixation) → grava `sha256(token)` em `sessions` com `expires_at` (deslizante) **e** `absolute_expires_at` (teto rígido) → seta cookie `__Host-session` (httpOnly, Secure, SameSite=Lax, Path=/, sem Domain).
- **Cada request:** busca `sha256(cookie)` em `sessions`, checa `expires_at > now()` **e** `absolute_expires_at > now()`; renova o deslizante.
- **Logout:** `DELETE` da linha da sessão + limpa `localStorage` de listas (celular de família).
- **Reset de senha concluído:** `DELETE FROM sessions WHERE user_id=?` (derruba todas).

### Fonte da verdade
- **Servidor:** identidade/existência de listas, itens, produtos, histórico, ranking, e o `is_purchased` que vale no reload.
- **localStorage (espelho descartável):** progresso da lista ativa (pintar rápido no reabrir) + fila de pendentes + rascunho de edição. **Nunca** cria verdade; o servidor sempre sobrescreve, exceto uma marcação local ainda-não-sincronizada. Ler localStorage **só em `useEffect`** (senão dá hydration mismatch). Chave amarrada ao `user_id`.

---

## 4. Análise de segurança (auth-do-zero — bloqueantes antes de produção)

> Consolidado do painel AppSec. Tudo isto vira task/teste na Fase 3.

**Senha:**
- Hash **argon2id** via `@node-rs/argon2` (binário Rust, funciona na Vercel). Plano B à prova de bala: `bcryptjs` (JS puro) cost 12. Params argon2id: `memoryCost≥19456`, `timeCost=2`, `parallelism=1` (não estourar memória da função serverless).
- `runtime='nodejs'` obrigatório nos endpoints de hash.
- Armazenar **só o hash**; nunca texto puro. Validar força mínima da senha.

**Login (anti-enumeração + anti-timing):**
- Mensagem genérica "E-mail ou senha inválidos".
- **Se o usuário não existe, rodar mesmo assim um `verify` contra um hash dummy fixo** (iguala o tempo — senão o timing denuncia quais e-mails existem).

**Sessão:**
- Token opaco 256 bits (RNG seguro), guardado como `sha256`. Rotação no login. Deslizante + absoluta. Cookie `__Host-`.

**CSRF:**
- **Nenhuma mutação em GET** (só POST/PUT/DELETE). Server Actions do Next já checam Origin. **Route Handlers (marcar item) validam `Origin`** manualmente contra o domínio. Token CSRF explícito fica como dívida consciente.

**Reset de senha:**
- Token só como hash; expiração **15–30 min**; **single-use atômico** (`UPDATE ... WHERE used_at IS NULL RETURNING`); ao usar, troca a senha, invalida o token, invalida outros tokens pendentes e **derruba todas as sessões**.
- Página de reset com `<meta name="referrer" content="no-referrer">` e sem recursos de terceiros (não vazar token no Referer). Não logar `request.url`.
- **Mesma resposta** para e-mail existente/inexistente.

**Rate limiting (serverless não tem memória entre invocations!):**
- **Upstash Redis** (`@upstash/ratelimit`) por **IP** e por **conta** (ex.: 5 tentativas/15 min por conta). Aplicar em login e em "esqueci a senha". `429` + `Retry-After`. (Vercel WAF como 1ª linha, opcional.)

**Segredos / logs / transporte:**
- **Nenhum segredo com prefixo `NEXT_PUBLIC_`** (vaza no bundle do cliente). `DATABASE_URL`, `RESEND_API_KEY`, segredo de sessão: só server-side.
- **Nunca** `console.log(req.body)` no login (joga senha em texto nos logs).
- Header **HSTS** (`Strict-Transport-Security`).

**LGPD (dado pessoal: e-mail + hábitos):**
- Registrar consentimento **demonstrável**: `consent_at` + `privacy_version` (checkbox não pré-marcado).
- **Verificação de e-mail no cadastro** *(decisão D8)*.
- **Exclusão de conta em cascata real** (sessões, tokens, listas, itens, produtos, user) numa transação. `ON DELETE CASCADE` nas FKs a partir de `users` cuida disso.
- Exportar dados do usuário (um JSON) — pode ser manual no início.

---

## 5. Análise de resiliência

- **Net ruim é o caso normal.** Otimista + fila localStorage + reenvio ao voltonline cobre "net oscilando no mercado" sem virar app offline. **Não construir** service worker/CRDT/sync bidirecional (escopo de 1 usuário elimina conflito).
- **Sessão expira com trabalho na tela:** preservar rascunho em localStorage e reautenticar sem descartar (RNF-Resiliência).
- **Cache do App Router:** após **toda** mutation, `revalidatePath`/`revalidateTag`; leituras por-usuário como dinâmicas (`cookies()` já força dinâmico). Senão a lista mostra estado velho e parece "salvou errado".
- **Degradação graciosa:** nada de tela travada "salvando..."; erro de transporte é "pendente", não "falhou".

---

## 6. Mudanças de banco (SQL idempotente — JP roda manual)

> Rodar no **Neon (branch de dev primeiro)**. `pgcrypto` dá `gen_random_uuid()`.
> A tabela `email_verification_tokens` só é necessária se **D8 = sim** (pode rodar mesmo assim; fica ociosa se não usar).

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL,
  password_hash     text        NOT NULL,
  email_verified_at timestamptz,
  consent_at        timestamptz NOT NULL,
  privacy_version   text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_uidx
  ON users (lower(email)) WHERE deleted_at IS NULL;

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash          text        NOT NULL,
  expires_at          timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_uidx ON sessions (token_hash);
CREATE INDEX        IF NOT EXISTS sessions_user_id_idx     ON sessions (user_id);

-- PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text        NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS prt_token_hash_uidx ON password_reset_tokens (token_hash);
CREATE INDEX        IF NOT EXISTS prt_user_id_idx      ON password_reset_tokens (user_id);

-- EMAIL VERIFICATION TOKENS (D8)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text        NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS evt_token_hash_uidx ON email_verification_tokens (token_hash);
CREATE INDEX        IF NOT EXISTS evt_user_id_idx      ON email_verification_tokens (user_id);

-- PRODUCTS (catálogo canônico por usuário)
CREATE TABLE IF NOT EXISTS products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name    text        NOT NULL,
  normalized_name text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS products_user_norm_uidx
  ON products (user_id, normalized_name) WHERE deleted_at IS NULL;
CREATE INDEX        IF NOT EXISTS products_user_id_idx ON products (user_id);

-- LISTS
CREATE TABLE IF NOT EXISTS lists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        text,
  status       text        NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  CONSTRAINT lists_status_chk CHECK (status IN ('active','completed'))
);
CREATE UNIQUE INDEX IF NOT EXISTS lists_one_active_per_user_uidx
  ON lists (user_id) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS lists_user_status_completed_idx
  ON lists (user_id, status, completed_at);

-- LIST ITEMS
CREATE TABLE IF NOT EXISTS list_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id      uuid        NOT NULL REFERENCES lists(id)    ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity     integer     NOT NULL DEFAULT 1,
  is_purchased boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT list_items_qty_chk       CHECK (quantity > 0),
  CONSTRAINT list_items_list_prod_uq  UNIQUE (list_id, product_id)
);
CREATE INDEX IF NOT EXISTS list_items_list_id_idx    ON list_items (list_id);
CREATE INDEX IF NOT EXISTS list_items_product_id_idx ON list_items (product_id);
CREATE INDEX IF NOT EXISTS list_items_purchased_idx  ON list_items (list_id) WHERE is_purchased;

COMMIT;
```

**Query da Home ("mais consumidos"):**
```sql
SELECT p.id, p.display_name, COUNT(DISTINCT li.list_id) AS vezes
FROM list_items li
JOIN lists    l ON l.id = li.list_id
JOIN products p ON p.id = li.product_id
WHERE l.user_id = $1
  AND l.status = 'completed'
  AND l.completed_at > now() - interval '90 days'
  AND li.is_purchased
GROUP BY p.id, p.display_name
ORDER BY vezes DESC, MAX(l.completed_at) DESC
LIMIT 10;
```

**Verificação (rodar após o BEGIN/COMMIT):**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY 1;
-- esperado: email_verification_tokens, list_items, lists,
--           password_reset_tokens, products, sessions, users
```

---

## 7. Decisões desta fase (para o gate)

- **D6 — ORM/driver:** ✅ Drizzle + `neon-http`; pooled no app, direct nas migrations.
- **D7 — Sessão:** ✅ opaca no banco (server-side), não JWT (permite revogar; ensina mais).
- **D8 — Verificação de e-mail no cadastro?** ✅ **SIM** (JP, 2026-08-31). Conta só ativa após confirmar o e-mail; usa `email_verification_tokens`.
- **D9 — Dependências novas (contas grátis):** ✅ **Resend** (envio de e-mail) + **Upstash Redis** (rate limit) aprovados. Criar as contas na fase de implementação.

## 8. UI (Fase 2B) — direção aprovada

**Direção visual escolhida pelo JP (2026-08-31): "A — Mercadinho".**
- **Claro = branco** (`#fbfbf9`), **escuro = preto OLED** (`#0f110e`). O app terá os dois temas.
- **Identidade:** verde-feira como cor primária, números/quantidades em fonte de recibo (DM Mono),
  títulos em Familjen Grotesk, corpo em Hanken Grotesk, divisórias tracejadas (perfuração de cupom).
- Mockups validados no builder: [3 direções](https://claude.ai/code/artifact/bfc4ae1f-1af2-4dff-a104-5f96a6c8e17f) · [A no escuro](https://claude.ai/code/artifact/b5da58fe-e017-4401-8d94-cc5b7b64267b).
- Design-system completo abaixo (§9), validado por painel adversarial (design-system + acessibilidade).

---

## 9. Design-system "Mercadinho" (validado — base do código)

> Contraste auditado (WCAG AA) e disciplina de sistema travada. Estes tokens viram as CSS variables /
> config do Tailwind na Fase 3. Valores já corrigidos (o mockup inicial usava alguns hex que reprovaram).

### 9.1 As 3 travas de disciplina (o que impede virar "slop verde")
1. **Tracejado = evento semântico raro** (perfuração de cupom): no máximo 1–2 por tela, só em fronteira
   com significado (separar "no carrinho" de "a pegar", marcar um total). Divisória comum de linha = **hairline sólido**.
2. **Mono (DM Mono) = só dígito, unidade e label-de-recibo** (QTD, TOTAL, "3/8"). **Nunca** em texto livre,
   nome de item ou título.
3. **Verde = intenção contida, ≤3 ocorrências por tela.** Cor de ação/estado, não de superfície.
   - **PODE:** 1 botão primário/tela · check do item · trilho de progresso · anel de foco · logo/marca.
   - **NÃO PODE:** texto de leitura · ícones neutros · bordas/divisórias · fundo de card · placeholder/metadados.
4. Sem "accent bar" vertical colorida no card; raios contidos (**6–8px**, não pill em tudo); layout
   **alinhado à esquerda e denso** (centralizado só em empty state). É ferramenta de mercado, não landing.

### 9.2 Tokens de cor — TEMA CLARO
```
--bg:            #fbfbf9   /* página */
--surface:       #ffffff   /* card/painel (separa do bg por hairline + sombra sutil) */
--surface-sunken:#f4f5f2   /* inset (trilho, campo) */
--ink:           #1a1e1b   /* texto primário           16.9:1 */
--muted:         #5f6862   /* texto secundário          5.76:1 */
--num:           #545b54   /* números/mono secundários  ~5.9:1 (mín. 14px) */
--primary:       #17794c   /* verde de AÇÃO: botão/link/texto verde   5.42:1 */
--primary-strong:#12633e   /* verde-escuro p/ label/count             7.29:1 */
--accent-fill:   #1e8e5a   /* preenchimento sem texto: progresso, check(bg) */
--done:          #6f776f   /* texto de item concluído   4.62:1 */
--hairline:      #e6e9e2   /* divisória/borda decorativa */
--border-field:  #8d958a   /* borda de input/estado (precisa 3:1)  ~3.0:1 */
--danger:        #c62828   /* texto destrutivo 5.62:1 */
--danger-border: #d32f2f
--danger-bg:     #fbeae7
--warning:       #b7791f
--warning-bg:    #faf3e4
--info:          #3a6ea5
--focus-ring:    #1f9d63   /* anel de foco (serve nos 2 temas) */
--selection:     #e4f1ea
--disabled-fg:   #b3b9b2
--disabled-bg:   #f0f1ee
--overlay:       rgba(26,30,27,.45)
```

### 9.3 Tokens de cor — TEMA ESCURO (OLED)
```
--bg:            #0f110e
--surface:       #191c18
--surface-sunken:#20241f
--ink:           #eaece7   /* 14.5:1 */
--muted:         #8f968e   /* 5.67:1 */
--num:           #a7aea6
--primary:       #33bd78   /* verde de ação/texto   7.12:1 */
--primary-strong:#58cc90   /* label/count           8.57:1 */
--accent-fill:   #2fae70   /* progresso/check(bg) c/ tique #0f2a1e  5.41:1 */
--done:          #838a82   /* concluído  4.85:1 */
--hairline:      #272b27
--border-field:  #6c7268   /* 3.48:1 */
--danger:        #ff6b6b   /* 6.20:1 */
--danger-border: #d93636
--danger-bg:     #2a1b18
--warning:       #e0a63b
--warning-bg:    #2a2417
--info:          #5b9bd5
--focus-ring:    #1f9d63   /* 4.97:1 sobre surface */
--selection:     #12331f
--disabled-fg:   #565c54
--disabled-bg:   #1f231e
--overlay:       rgba(0,0,0,.72)   /* OLED precisa ser mais opaco pra separar */
```
> **Sucesso = o próprio verde primário.** Não criar um segundo verde de "sucesso" (rouba o significado da marca).

### 9.4 Escala tipográfica (9 estilos, mobile-first, pesos 400/500/600)
**Familjen Grotesk (títulos):** Display 28/32·600 · H1 22/28·600 · H2 18/24·500 · H3 15/20·500.
**Hanken Grotesk (corpo):** Body 16/24·400 (piso mobile — não descer) · Small 14/20·400 · Micro 12/16·500.
**DM Mono (números, `font-feature-settings:"tnum"`):** Numeric 16/24·400 (dado principal: preço/qtd) ·
Numeric-lg 20/24·500 (total) · Receipt-label 11/16·500 uppercase `.08em` (só rótulo QTD/TOTAL, nunca o valor).
> Números críticos (preço/quantidade) **≥14px**, cor `--num` ou mais escura. Nunca o texto mais fraco da tela.

### 9.5 Componentes-núcleo e estados obrigatórios
Componentes a definir já: **Botão** (primário/secundário/ghost/destrutivo) · **Input** (texto e numérico) ·
**Item-da-lista** (o componente-assinatura: checkbox + nome + qty) · **Chip** · **Card** · **Bottom-nav** ·
**Empty state** · **Toast** (com desfazer) · **Modal/sheet** de confirmação · **Progress**.

**Checklist de estados por componente interativo (o que iniciante esquece):**
- `focus-visible`: anel `--focus-ring` 2px + `outline-offset:2px` (o mais esquecido; obrigatório AA).
- `pressed/active`: feedback tátil imediato (mobile não tem hover — priorize este).
- `disabled`: usar `--disabled-*`, **nunca** `opacity:.5` (quebra contraste, some no OLED).
- `loading`: botão ocupado + bloqueio de duplo-clique.
- `error` (input): borda `--danger-border` **+ ícone + mensagem** (`aria-invalid`/`aria-describedby`), nunca só cor.

### 9.6 Regras de acessibilidade travadas
- **Item concluído:** `--done` (cor) + **tique real (✓) no checkbox** como canal de forma. **Sem strikethrough.**
  (Resolve o conflito design × a11y: a forma do tique é o canal não-colorido, sem o clichê do riscado.)
- **Todo estado precisa de forma/ícone além da cor** (feito, selecionado, erro) — daltônico.
- **Alvo de toque ≥44px (recomendado 48px):** checkbox, "+", cada item de nav. **A linha inteira do item é tocável** para marcar.
- **Excluir sempre com desfazer** (toast undo) — perder item/lista sem undo é inaceitável num app de mercado.
- Preço/quantidade nunca abaixo de 14px.
