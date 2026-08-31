import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/inicio");

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="text-center">
        <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.08em] text-muted">meu mercado</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[32px] font-semibold tracking-tight text-ink">Meu Mercado</h1>
        <p className="mt-2 text-muted">Sua lista de compras, do jeito que você compra.</p>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/entrar" className={cn(buttonVariants(), "w-full")}>Entrar</Link>
        <Link href="/cadastro" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>Criar conta</Link>
      </div>
    </main>
  );
}
