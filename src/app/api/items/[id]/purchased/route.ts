import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { setItemPurchased } from "@/db/list-items";

export const runtime = "nodejs";

// CSRF: como é Route Handler (não Server Action), a checagem de Origin é manual (design.md §4).
function originOk(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // navegação same-origin pode omitir; o cookie SameSite=Lax protege
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

// Marcar/desmarcar item — recebe o ESTADO DESEJADO (idempotente, não toggle).
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!originOk(req)) return NextResponse.json({ error: "origin" }, { status: 403 });

  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "auth" }, { status: 401 });

  const { id } = await ctx.params;

  let body: { purchased?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  if (typeof body.purchased !== "boolean") {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }

  const ok = await setItemPurchased(userId, id, body.purchased);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
