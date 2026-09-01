import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getCompletedListById } from "@/db/lists";
import { getItemsForList } from "@/db/list-items";
import { formatDatePt } from "@/lib/date";
import { formatBRL } from "@/lib/money";
import { groupByCategory } from "@/lib/categories";
import { Check } from "@/components/icons";
import { cn } from "@/lib/utils";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Compra — Meu Mercado" };

export default async function HistoricoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const list = await getCompletedListById(user.id, id);
  if (!list) notFound(); // não é do usuário / não existe / não concluída → 404

  const items = await getItemsForList(user.id, id);
  const comprados = items.filter((i) => i.isPurchased).length;
  const totalCents = items.reduce((s, i) => s + (i.unitPriceCents ?? 0) * i.quantity, 0);
  const semPreco = items.filter((i) => i.unitPriceCents == null).length;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 md:px-10 md:py-10">
      <Link href="/historico" className="text-sm text-muted transition-colors hover:text-ink">
        ← Histórico
      </Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-[22px] font-semibold text-ink">
        Compra de {formatDatePt(list.completedAt)}
      </h1>
      <p className="mb-6 mt-0.5 text-sm text-muted">
        <span className="font-[family-name:var(--font-num)] tabular-nums">{comprados}</span> de{" "}
        <span className="font-[family-name:var(--font-num)] tabular-nums">{items.length}</span> itens comprados · somente leitura
      </p>

      {groupByCategory(items).map((group) => (
        <section key={group.key} aria-labelledby={`hist-${group.key}`} className="mb-1">
          <h2
            id={`hist-${group.key}`}
            className="mb-1 mt-4 border-t border-hairline pt-3 font-[family-name:var(--font-num)] text-[11px] font-normal uppercase tracking-[0.1em] text-muted"
          >
            {group.label}
          </h2>
          <ul>
            {group.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 border-b border-hairline py-3 last:border-b-0">
            <span
              className={cn(
                "flex h-5 w-5 flex-none items-center justify-center rounded-md border",
                it.isPurchased ? "border-accent-fill bg-accent-fill text-on-primary" : "border-border-field text-transparent"
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span className={cn("min-w-0 flex-1 truncate text-sm", it.isPurchased ? "text-done" : "text-ink")}>{it.name}</span>
            {it.quantity > 1 && (
              <span className="font-[family-name:var(--font-num)] tabular-nums text-xs text-muted">×{it.quantity}</span>
            )}
            <span className="min-w-[64px] text-right font-[family-name:var(--font-num)] tabular-nums text-sm text-num">
              {it.unitPriceCents != null ? formatBRL(it.unitPriceCents * it.quantity) : "—"}
            </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
        <span className="text-[11px] uppercase tracking-[0.09em] text-muted">
          {semPreco > 0 ? `total · ${semPreco} sem preço` : "total"}
        </span>
        <span className="font-[family-name:var(--font-num)] tabular-nums text-lg font-medium text-ink">{formatBRL(totalCents)}</span>
      </div>
    </div>
  );
}
