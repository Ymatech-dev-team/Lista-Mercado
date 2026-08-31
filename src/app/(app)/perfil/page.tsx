import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { logoutAction } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Perfil — Meu Mercado" };

export default async function PerfilPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-[24px] font-semibold text-ink">Perfil</h1>

      <Card className="mb-4">
        <p className="text-[11px] font-[family-name:var(--font-num)] uppercase tracking-[0.09em] text-muted">e-mail</p>
        <p className="mt-1 text-ink">{user.email}</p>
      </Card>

      <form action={logoutAction}>
        <Button type="submit" variant="secondary" className="w-full">Sair</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">Excluir minha conta — em breve.</p>
    </div>
  );
}
