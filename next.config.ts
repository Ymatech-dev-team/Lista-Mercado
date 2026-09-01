import type { NextConfig } from "next";

// Headers de segurança (design.md §4). A Vercel não os adiciona por padrão.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // Offline nativo do Next 16 (design.md ADR-1): navegação/RSC/Server Action que falham por rede
  // ficam pendentes e reenviam ao reconectar; o hook useOffline() alimenta o banner. Experimental.
  experimental: { useOffline: true },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // O SW nunca pode ficar cacheado, senão o update trava (guia PWA §8).
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
