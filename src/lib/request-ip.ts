import { headers } from "next/headers";

// IP do cliente para rate-limit. Na Vercel, x-real-ip é setado pela plataforma e NÃO é
// spoofável; o x-forwarded-for pode ser prefixado pelo cliente (a entrada da esquerda é dele) —
// por isso, no fallback, usamos a ÚLTIMA entrada. (design.md §4 · F1)
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}
