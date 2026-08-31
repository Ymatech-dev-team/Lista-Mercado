import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { exportUserData } from "@/db/export";

export const runtime = "nodejs";

// Exporta os dados do próprio usuário (LGPD). GET é seguro (leitura), escopado pela sessão.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "auth" }, { status: 401 });

  const data = await exportUserData(userId);

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="meus-dados-meu-mercado.json"',
    },
  });
}
