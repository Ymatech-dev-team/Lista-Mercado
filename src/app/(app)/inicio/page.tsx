import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getMostConsumed } from "@/db/products";
import { MostConsumed } from "@/components/most-consumed";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Início — Meu Mercado" };

export default async function InicioPage() {
  const user = await requireUser();
  const mostConsumed = await getMostConsumed(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold text-ink">Bem-vindo</h1>
      <p className="mt-1 text-muted">Sua lista de compras, do jeito que você compra.</p>

      <div className="mt-5">
        <Link href="/lista" className={cn(buttonVariants(), "w-full sm:w-auto")}>Abrir minha lista</Link>
      </div>

      <section className="mt-9">
        <p className="mb-4 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">você sempre compra</p>
        {mostConsumed.length ? (
          <MostConsumed items={mostConsumed} />
        ) : (
          <div className="rounded-xl border border-dashed border-hairline bg-surface px-6 py-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-[17px] font-medium text-ink">Ainda não há dados</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              Conclua sua primeira lista e a gente mostra aqui o que você mais compra.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
