import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getActiveList, getCompletedLists, getItemsPurchasedThisMonth, getMonthlySpendCents, getLastCompletedTotalCents } from "@/db/lists";
import { getItemsForList } from "@/db/list-items";
import { getMostConsumed } from "@/db/products";
import { getMonthlyBudgetCents } from "@/db/users";
import { MostConsumed } from "@/components/most-consumed";
import { MonthPanel } from "@/components/month-panel";
import { ConcludeButton } from "@/app/(app)/lista/conclude-button";
import { buttonVariants } from "@/components/ui/button";
import { ChevronRight } from "@/components/icons";
import { formatDatePt } from "@/lib/date";
import { cn } from "@/lib/utils";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Início — Meu Mercado" };

function Label({ children }: { children: string }) {
  return (
    <p className="mb-3 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">{children}</p>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const c = 2 * Math.PI * 42;
  const off = c * (1 - pct / 100);
  return (
    <div className="relative h-24 w-24 flex-none">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="none" stroke="var(--surface-sunken)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r="42"
          fill="none"
          stroke="var(--accent-fill)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[family-name:var(--font-num)] text-[20px] font-medium text-ink">{done}/{total}</span>
        <span className="font-[family-name:var(--font-num)] text-[10px] text-muted">no carrinho</span>
      </div>
    </div>
  );
}

export default async function InicioPage() {
  const user = await requireUser();
  const [active, completed, mostConsumed, itensMes, spentCents, lastCents, budgetCents] = await Promise.all([
    getActiveList(user.id),
    getCompletedLists(user.id),
    getMostConsumed(user.id),
    getItemsPurchasedThisMonth(user.id),
    getMonthlySpendCents(user.id),
    getLastCompletedTotalCents(user.id),
    getMonthlyBudgetCents(user.id),
  ]);
  const items = active ? await getItemsForList(user.id, active.id) : [];
  const done = items.filter((i) => i.isPurchased).length;
  const projectionCents = active ? items.reduce((s, i) => s + (i.unitPriceCents ?? 0) * i.quantity, 0) : null;
  const projectionMissing = items.filter((i) => i.unitPriceCents == null).length;
  const recent = completed.slice(0, 3);
  const favorite = mostConsumed[0]?.name ?? "—";

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-10 md:py-10">
      <header className="mb-6">
        <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">meu mercado</p>
        <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold text-ink">Bem-vindo de volta</h1>
      </header>

      {/* Hero — lista ativa */}
      {active ? (
        <div className="flex items-center justify-between gap-6 rounded-2xl border border-hairline bg-surface p-6">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">lista ativa</p>
            <p className="mb-4 mt-0.5 font-[family-name:var(--font-display)] text-[20px] font-medium text-ink">
              {active.title ?? "Minha lista"}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/lista" className={cn(buttonVariants(), "h-10")}>Ver lista</Link>
              {items.length > 0 && <ConcludeButton />}
            </div>
          </div>
          <ProgressRing done={done} total={items.length} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface px-6 py-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-[18px] font-medium text-ink">Nenhuma lista ativa</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Comece uma lista e marque os itens conforme for pegando.</p>
          <Link href="/lista" className={cn(buttonVariants(), "mt-4")}>Começar uma lista</Link>
        </div>
      )}

      {/* Números */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-surface-sunken p-4">
          <div className="font-[family-name:var(--font-num)] text-[24px] font-medium text-ink">{completed.length}</div>
          <div className="mt-0.5 text-[13px] text-muted">compras concluídas</div>
        </div>
        <div className="rounded-xl bg-surface-sunken p-4">
          <div className="font-[family-name:var(--font-num)] text-[24px] font-medium text-ink">{itensMes}</div>
          <div className="mt-0.5 text-[13px] text-muted">itens no mês</div>
        </div>
        <div className="min-w-0 rounded-xl bg-surface-sunken p-4">
          <div className="truncate font-[family-name:var(--font-display)] text-[19px] font-semibold text-ink">{favorite}</div>
          <div className="mt-0.5 text-[13px] text-muted">mais comprado</div>
        </div>
      </div>

      {/* Resumo do mês */}
      <section className="mt-9">
        <Label>este mês</Label>
        <MonthPanel
          spentCents={spentCents}
          budgetCents={budgetCents}
          projectionCents={projectionCents}
          projectionMissing={projectionMissing}
          projectionTotal={items.length}
          lastCents={lastCents}
        />
      </section>

      {/* Você sempre compra */}
      {mostConsumed.length > 0 && (
        <section className="mt-9">
          <Label>você sempre compra</Label>
          <MostConsumed items={mostConsumed} />
        </section>
      )}

      {/* Últimas compras */}
      {recent.length > 0 && (
        <section className="mt-9">
          <Label>últimas compras</Label>
          <ul className="space-y-2">
            {recent.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/historico/${l.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-sunken"
                >
                  <div>
                    <p className="text-[15px] font-medium text-ink">{l.title ?? `Compra de ${formatDatePt(l.completedAt)}`}</p>
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
        </section>
      )}
    </div>
  );
}
