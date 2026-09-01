# Design — PWA + lembretes de recompra (v1)

Como construir [requirements.md](requirements.md). Ancorado nos docs do Next 16 (offline-support, use-offline,
manifest, progressive-web-apps). Mockup aprovado (banner offline + lembretes na Home + convite de instalação).

## 1. Config — `next.config.ts`

- `experimental: { useOffline: true }` (ADR-1). **Não** ligar `cacheComponents` (ADR-2).
- `headers()`: manter os de segurança/HSTS já existentes; **adicionar** bloco pra `/sw.js`:
  `Cache-Control: no-cache, no-store, must-revalidate` + `Content-Type: application/javascript`
  (guia PWA §8 — garante que o SW nunca fica cacheado).

## 2. Manifest + ícones

- `app/manifest.ts` → `MetadataRoute.Manifest` (estático/cacheável): `name: "Meu Mercado"`, `short_name: "Mercado"`,
  `start_url: "/inicio"`, `display: "standalone"`, `background_color: "#fbfbf9"`, `theme_color: "#17794c"`,
  `icons`: 192, 512 e 512 `purpose: "maskable"`.
- **Ícones (dependência a resolver):** o manifest precisa de PNGs 192/512. Duas opções: (a) JP fornece PNGs do
  mascote do carrinho em `public/` (ele gerou o mascote no GPT); (b) eu gero um ícone de marca simples
  (quadrado verde arredondado + o `CartMark` do app-shell) via `ImageResponse` servido em rota estável. **Decisão
  operacional** — proponho (b) como fallback pra não travar, e você troca pelo mascote quando quiser. `app/icon.tsx`
  + `app/apple-icon.tsx` (ImageResponse) cobrem favicon/aba/iOS.

## 3. Offline — `useOffline` (sem cache) + SW mínimo (cold-start)

- **Em-sessão (ADR-1):** `OfflineBanner` (client, `useOffline()` de `next/offline`) no layout raiz — banner some ao
  reconectar (RF8). Server Actions/navegação pendem e reenviam sozinhas (RF7); nos controles, rótulo "salvando
  (offline)…" via `useTransition` + `useOffline` (RF9). A fila `mm:pending` fica intacta (RF10).
- **SW mínimo `public/sw.js` (ADR-4, RF11-RF13):**
  - Registro client-side (`navigator.serviceWorker.register('/sw.js', { scope:'/', updateViaCache:'none' })`) num
    componente client no layout.
  - `install`: precache só `/offline` + estáticos essenciais; `self.skipWaiting()` **só** quando o usuário aceitar
    o "atualizar" (via `postMessage`), não automático.
  - `activate`: `clients.claim()` + apagar caches cujo nome ≠ versão atual (`mm-shell-v<N>`).
  - `fetch`: **navegação (`request.mode === 'navigate'`) → network-first**, fallback pro shell/`/offline`; estáticos
    `/_next/static/*` (hasheados) → cache-first; **`/api/*` e RSC autenticado → network-only, nunca cachear** (RF13).
  - **Update flow (RF12):** o registrador escuta `updatefound`/`waiting`; havendo novo SW com controller ativo,
    dispara um toast "Nova versão — atualizar" que faz `postMessage('skip-waiting')` + `location.reload()`.
  - Uma rota `/offline` (page simples estática) como fallback de navegação.

## 4. Lembretes de recompra — `getRepurchaseReminders(userId)` (products.ts)

Sem tabela nova (ADR-5). Computa do histórico, reancorado em `lists.userId`, `isPurchased`, `isNull(deletedAt)`,
dias no fuso `America/Sao_Paulo`.

- CTE: por produto, sequência de `completedAt` de **listas concluídas distintas** onde foi comprado; `lag()` pra
  achar os intervalos; `avg(interval)` e `count`. Só produtos com **≥2 compras** (≥1 intervalo).
- `daysSince = (hoje_SP − max(completedAt)_SP)` em dias.
- Incluir quando `daysSince > avgInterval * FATOR` (FATOR ≈ 1.0) **e** `daysSince ≤ avgInterval * ABANDONO`
  (ABANDONO ≈ 3 — não nagar item abandonado, RF17). Variância alta (stddev > avg) → omitir (RF18).
- Excluir produtos que já estão na **lista ativa** (subquery NOT IN) — RF16.
- Ordenar por atraso relativo (`daysSince / avgInterval` desc); `LIMIT 5` (RF19).
- Retorno: `{ productId, name, daysSince, avgIntervalDays }`.

## 5. UI dos lembretes (Home)

- Componente client `RepurchaseReminders` recebe a lista do servidor (no `Promise.all` de `inicio/page.tsx`) e
  **filtra no cliente** por dismiss/snooze (localStorage, ADR-6):
  - `mm:reminder-dismissed` = `{ [productId]: lastCompletedAtISO }` → oculta enquanto o snapshot bater; quando o
    produto é comprado de novo (novo `completedAt`), deixa de bater e o lembrete **reaparece** (RF21).
  - `mm:reminder-snooze` = `{ [productId]: untilEpochMs }` → oculta até o prazo.
  - Guardas de leitura do localStorage em try/catch (padrão do projeto).
- Cada linha (mockup aprovado): nome + "faz X dias · costuma comprar a cada Y" + **"+"** (chama `quickAddAction`,
  RF20; some da vista) + **"x"** dismiss. Seção "hora de repor?" só aparece se houver lembrete visível. Fica ao
  lado de "você sempre compra" em `/inicio`.

## 6. Convite de instalação — `InstallInvite` (client)

- Estados (RF1-RF5): captura `beforeinstallprompt` (Android → botão "Instalar" que chama `prompt()`); iOS/Safari
  (sem evento) → instrução "Compartilhar → Adicionar à Tela de Início"; `display-mode: standalone` → não mostrar;
  dispensar → flag `mm:install-dismissed` (≥30 dias) em localStorage; sem suporte → oculto.
- Renderiza discreto na Home (abaixo do hero), some quando instalado/dispensado.

## 7. Segurança & resiliência

- SW nunca cacheia dado autenticado (RF13); logout já limpa `mm:*` do localStorage (LogoutButton) — estender pros
  novos keys (`mm:reminder-*`, `mm:install-dismissed`). Cache versionado evita asset órfão.
- `getRepurchaseReminders` escopado por `userId` (anti-IDOR), parametrizado (sem `sql.raw`); `quickAddAction` já é
  escopado. Sem dado de dinheiro aqui.
- `useOffline` é **experimental** (D1) — pinamos a versão do Next; risco aceito.
- Testar offline com `next build && next start` (dev não é referência — doc do Next).

## 8. Fora de escopo

Push real/VAPID/cron (Sprint 3.5); `cacheComponents`; navegação offline de dados frescos; tabela de lembretes.
