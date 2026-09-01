import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getCompletedLists } from "@/db/lists";
import { formatDatePt } from "@/lib/date";
import { ChevronRight } from "@/components/icons";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Histórico — Meu Mercado" };

export default async function HistoricoPage() {
  const user = await requireUser();
  const completed = await getCompletedLists(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-[24px] font-semibold text-ink">Histórico</h1>

      {completed.length ? (
        <ul className="space-y-3">
          {completed.map((l) => (
            <li key={l.id}>
              <Link
                href={`/historico/${l.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-sunken"
              >
                <div>
                  <p className="font-medium text-ink">{l.title ?? `Compra de ${formatDatePt(l.completedAt)}`}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {l.title ? `${formatDatePt(l.completedAt)} · ` : ""}
                    <span className="font-[family-name:var(--font-num)] tabular-nums">{l.comprados}</span> de{" "}
                    <span className="font-[family-name:var(--font-num)] tabular-nums">{l.total}</span> itens comprados
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 flex-none text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-hairline bg-surface px-6 py-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-[17px] font-medium text-ink">Nenhuma compra ainda</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Conclua sua primeira lista e ela aparece aqui.</p>
        </div>
      )}
    </div>
  );
}
