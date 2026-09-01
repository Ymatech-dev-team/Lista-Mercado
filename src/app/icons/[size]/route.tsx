import { ImageResponse } from "next/og";

export const runtime = "nodejs";

// Ícone de marca gerado por código (fallback do mascote): quadrado verde cheio (maskable-safe, com
// zona de segurança) + o carrinho branco. Servido em /icons/192 e /icons/512 pro manifest.
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  const n = size === "512" ? 512 : 192;
  const cart = Math.round(n * 0.5);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#17794c",
        }}
      >
        <svg width={cart} height={cart} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6h15l-1.5 9h-12z" />
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M6 6 5 3H3" />
        </svg>
      </div>
    ),
    { width: n, height: n }
  );
}
