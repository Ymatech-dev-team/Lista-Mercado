import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Início — Meu Mercado" };

export default async function InicioPage() {
  await requireUser();
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold text-ink">Bem-vindo</h1>
      <p className="mt-1 text-muted">Sua lista de compras, do jeito que você compra.</p>

      <div className="mt-6 rounded-xl border border-dashed border-hairline bg-surface px-6 py-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-[17px] font-medium text-ink">Seus mais consumidos aparecem aqui</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          Conclua algumas listas e a gente mostra o que você mais compra.
        </p>
        <Link href="/lista" className={cn(buttonVariants(), "mt-4")}>Minha lista</Link>
      </div>
    </div>
  );
}
