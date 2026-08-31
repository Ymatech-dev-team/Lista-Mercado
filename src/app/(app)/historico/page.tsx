import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Histórico — Meu Mercado" };

export default async function HistoricoPage() {
  await requireUser();
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-[24px] font-semibold text-ink">Histórico</h1>
      <div className="rounded-xl border border-dashed border-hairline bg-surface px-6 py-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-[17px] font-medium text-ink">Em breve</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Quando você concluir listas, elas aparecem aqui.</p>
      </div>
    </div>
  );
}
