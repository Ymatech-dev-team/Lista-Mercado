// Service worker servido por route handler pra CARIMBAR a versão no build (design.md RF12): o
// commit sha muda os bytes do /sw.js a cada deploy → o navegador detecta SW novo → o toast
// "atualizar" dispara e o activate limpa caches antigos. Estático (força a leitura da env no build).
export const dynamic = "force-static";

const VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "dev";

// SW mínimo e seguro (ADR-4): navegação=network-first→/offline; estáticos hasheados=cache-first (só
// respostas ok); /api/* e RSC=rede pura (nunca cachear dado de usuário). Sem clients.claim (evita
// reload extra na 1ª visita); troca de versão só quando o usuário aceita (skip-waiting).
const SW = `
const SHELL_CACHE = "mm-shell-${VERSION}";
const PRECACHE = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline").then((r) => r || Response.error())));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
      )
    );
    return;
  }
});
`;

export function GET() {
  return new Response(SW, { headers: { "content-type": "application/javascript; charset=utf-8" } });
}
