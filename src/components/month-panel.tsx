import Link from "next/link";
import { formatBRL } from "@/lib/money";

// Painel do mês (design.md §7): gasto acumulado, projeção da compra ativa + comparação com a
// última concluída, e barra de teto em 3 estados. Cores semânticas (não contam como o verde da marca).
export function MonthPanel({
  spentCents,
  budgetCents,
  projectionCents,
  projectionMissing,
  projectionTotal,
  lastCents,
}: {
  spentCents: number;
  budgetCents: number | null;
  projectionCents: number | null; // null = sem lista ativa
  projectionMissing: number;
  projectionTotal: number;
  lastCents: number | null;
}) {
  // ----- teto (3 estados + "no limite") -----
  const over = budgetCents != null && spentCents > budgetCents;
  const atLimit = budgetCents != null && spentCents === budgetCents;
  const near = budgetCents != null && !over && !atLimit && spentCents >= budgetCents * 0.8;
  const rawPct = budgetCents ? Math.round((spentCents / budgetCents) * 100) : 0;
  const barPct = Math.max(0, Math.min(100, rawPct));
  const barColor = over ? "var(--danger)" : atLimit || near ? "var(--warning)" : "var(--accent-fill)";
  const statusColor = over ? "var(--danger)" : atLimit || near ? "var(--warning)" : "var(--muted)";
  const statusText = over
    ? `Estourou o teto · +${formatBRL(spentCents - budgetCents!)}`
    : atLimit
      ? "No limite · 100%"
      : near
        ? `Perto do limite · ${rawPct}%`
        : "Dentro do teto";

  // ----- projeção da compra ativa (RF21: sempre rotulada "projeção"; RF22: cobertura X de Y) -----
  const pricedCount = projectionCents == null ? 0 : projectionTotal - projectionMissing;
  const cmp =
    lastCents != null && lastCents > 0 && projectionCents != null && projectionCents > 0
      ? Math.round(((projectionCents - lastCents) / lastCents) * 100)
      : null;
  let projSub: string;
  if (projectionMissing > 0) {
    projSub = `projeção parcial · ${pricedCount} de ${projectionTotal} com preço`; // sem % (não engana)
  } else if (cmp == null) {
    projSub = "projeção";
  } else if (cmp === 0) {
    projSub = "projeção · igual à última";
  } else {
    projSub = `projeção · ${Math.abs(cmp)}% ${cmp < 0 ? "abaixo" : "acima"} da última`;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-sunken p-4">
          <p className="text-[13px] text-muted">gasto no mês</p>
          <p className="mt-0.5 font-[family-name:var(--font-num)] tabular-nums text-[22px] font-medium text-ink">{formatBRL(spentCents)}</p>
        </div>
        <div className="rounded-xl bg-surface-sunken p-4">
          <p className="text-[13px] text-muted">esta compra</p>
          {projectionCents == null ? (
            <p className="mt-0.5 text-[15px] text-muted">nenhuma lista ativa</p>
          ) : pricedCount === 0 ? (
            <>
              <p className="mt-0.5 font-[family-name:var(--font-num)] text-[22px] font-medium text-muted">—</p>
              <p className="mt-0.5 text-[12px] text-muted">adicione preços para ver a projeção</p>
            </>
          ) : (
            <>
              <p className="mt-0.5 font-[family-name:var(--font-num)] tabular-nums text-[22px] font-medium text-ink">{formatBRL(projectionCents)}</p>
              <p className="mt-0.5 text-[12px] text-muted">{projSub}</p>
            </>
          )}
        </div>
      </div>

      {budgetCents != null ? (
        <div className="mt-3 rounded-xl border border-hairline bg-surface p-4">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[13px]">
            <span className="min-w-0" style={{ color: statusColor }}>{statusText}</span>
            <span className="font-[family-name:var(--font-num)] tabular-nums text-muted">
              {formatBRL(spentCents)} / {formatBRL(budgetCents)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: barColor }} />
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-hairline bg-surface p-4 text-center text-[13px] text-muted">
          Defina um{" "}
          <Link href="/perfil" className="font-medium text-primary-strong underline underline-offset-2">
            teto mensal
          </Link>{" "}
          no Perfil para acompanhar seu limite aqui.
        </div>
      )}
    </div>
  );
}
