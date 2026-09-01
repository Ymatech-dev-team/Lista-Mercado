import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DeleteAccount } from "./delete-account";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Perfil — Meu Mercado" };

export default async function PerfilPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-[24px] font-semibold text-ink">Perfil</h1>

      <Card className="mb-4">
        <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">e-mail</p>
        <p className="mt-1 text-ink">{user.email}</p>
      </Card>

      <p className="mb-2 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">aparência</p>
      <div className="mb-8 flex flex-col gap-3">
        <ThemeToggle className="h-11 w-full justify-start border border-hairline bg-surface px-4 text-ink" />
        <a href="/api/export" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
          Exportar meus dados
        </a>
        <LogoutButton className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>Sair</LogoutButton>
      </div>

      <p className="mb-2 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">zona de perigo</p>
      <DeleteAccount />
    </div>
  );
}
