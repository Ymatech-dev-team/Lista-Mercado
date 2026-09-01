import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { setItemPrice } from "@/db/list-items";
import { priceCentsSchema } from "@/lib/validation/list";

export const runtime = "nodejs";

function originOk(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

// Define o preço unitário de um item (centavos inteiros, ou null = remover preço). Idempotente.
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!originOk(req)) return NextResponse.json({ error: "origin" }, { status: 403 });

  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "auth" }, { status: 401 });

  const { id } = await ctx.params;

  let body: { priceCents?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }

  // null é válido (limpa o preço); qualquer outro valor passa pelo schema estrito (sem coerção).
  const raw = body.priceCents;
  let priceCents: number | null;
  if (raw === null) {
    priceCents = null;
  } else {
    const parsed = priceCentsSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "price" }, { status: 400 });
    priceCents = parsed.data;
  }

  const ok = await setItemPrice(userId, id, priceCents);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
