import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { setItemQuantity } from "@/db/list-items";

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

// Ajusta a quantidade de um item (estado desejado absoluto → idempotente).
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!originOk(req)) return NextResponse.json({ error: "origin" }, { status: 403 });

  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "auth" }, { status: 401 });

  const { id } = await ctx.params;

  let body: { quantity?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  const q = Number(body.quantity);
  if (!Number.isFinite(q) || q < 1 || q > 9999) {
    return NextResponse.json({ error: "quantity" }, { status: 400 });
  }

  const ok = await setItemQuantity(userId, id, q);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
