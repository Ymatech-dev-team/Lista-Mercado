# Tasks — PWA + lembretes de recompra

Dependency-ordered. Cada escopo fecha e PARA para review. `→` critério (EARS) · `T:` teste. **Sem mudança de banco.**

## Escopo 1 — Manifest + ícones (instalável)
- [ ] **1.1** `app/icons/[size]/route.tsx`: ImageResponse (quadrado verde + carrinho) em 192/512. Fallback de marca.
- [ ] **1.2** `app/apple-icon.tsx`: ícone iOS (180). `app/manifest.ts`: name/short_name/start_url/standalone/theme/icons (192,512,512 maskable). → RF6. `T:` build; GET /manifest.webmanifest e /icons/512 respondem.

## Escopo 2 — useOffline + banner
- [ ] **2.1** `next.config.ts`: `experimental.useOffline = true`. → ADR-1/RF7.
- [ ] **2.2** `OfflineBanner` (client, `next/offline`) no layout raiz. → RF8. Rótulo offline em ações-chave (RF9) onde couber.

## Escopo 3 — Service worker mínimo (cold-start + update)
- [ ] **3.1** `public/sw.js`: cache versionado `mm-shell-v<N>`; navigate→network-first (fallback shell/`/offline`); estáticos hasheados→cache-first; `/api/*`+RSC→network-only; activate limpa caches antigos; skipWaiting só via postMessage. → RF11/RF12/RF13.
- [ ] **3.2** `app/offline/page.tsx` (fallback). Registrador client (layout) + toast "nova versão → recarregar". `next.config` headers `/sw.js` no-store. → RF12.

## Escopo 4 — Lembretes de recompra
- [ ] **4.1** `getRepurchaseReminders(userId)` (products.ts): CTE lag()/avg intervalo, ≥2 compras, fuso SP, fator+abandono, exclui lista ativa + soft-deleted, top 5. → RF14-RF19/RF22. `T:` unit da lógica de elegibilidade (extrair função pura de threshold).
- [ ] **4.2** `RepurchaseReminders` (client) na Home: "+"→quickAddAction (RF20), dismiss/snooze em localStorage (RF21). LogoutButton limpa `mm:reminder-*`. → RF23.

## Escopo 5 — Convite de instalação
- [ ] **5.1** `InstallInvite` (client): beforeinstallprompt (Android), instrução iOS, standalone oculta, dismiss 30d localStorage, sem-suporte oculto. → RF1-RF5.

Cobertura: RF1-RF23. Testar offline com `next build && next start`.
