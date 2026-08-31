import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logoutAction } from "./auth-actions";

export const runtime = "nodejs";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="text-center">
        <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.08em] text-muted">meu mercado</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[32px] font-semibold tracking-tight text-ink">Meu Mercado</h1>
        <p className="mt-2 text-muted">Sua lista de compras, do jeito que você compra.</p>
      </div>

      {user ? (
        <div className="mt-8 space-y-4">
          <p className="text-center text-sm text-ink">
            Você está logado como <strong>{user.email}</strong>.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/ui" className={cn(buttonVariants(), "w-full")}>Ver design-system</Link>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" className="w-full">Sair</Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/entrar" className={cn(buttonVariants(), "w-full")}>Entrar</Link>
          <Link href="/cadastro" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>Criar conta</Link>
        </div>
      )}
    </main>
  );
}
