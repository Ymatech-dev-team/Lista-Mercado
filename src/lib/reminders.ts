// Lembretes de recompra: a query traz candidatos (cadência do histórico) e ESTA função pura decide
// quais viram lembrete — testável isoladamente (design.md RF14-RF19).

export type ReminderCandidate = {
  productId: string;
  name: string;
  intervals: number; // nº de intervalos entre compras (>=1 → ≥2 compras)
  avgIntervalDays: number; // intervalo médio entre compras
  stddevDays: number; // dispersão da cadência
  daysSince: number; // dias desde a última compra
  lastCompletedAt: string; // ISO — marca o ciclo atual (dispensar "até a próxima compra")
};

export type Reminder = {
  productId: string;
  name: string;
  daysSince: number;
  avgIntervalDays: number;
  lastCompletedAt: string;
};

export type PickOptions = {
  factor?: number; // vencido quando daysSince >= avg * factor (default 1.0)
  abandonK?: number; // ignora abandonado: daysSince > avg * abandonK (default 3)
  maxVarianceRatio?: number; // ignora cadência irregular: stddev > avg * ratio (default 1.0)
  limit?: number; // top N (default 5)
};

export function pickReminders(candidates: ReminderCandidate[], opts: PickOptions = {}): Reminder[] {
  const { factor = 1, abandonK = 3, maxVarianceRatio = 1, limit = 5 } = opts;
  return candidates
    .filter((c) => c.avgIntervalDays > 0)
    .filter((c) => c.daysSince >= c.avgIntervalDays * factor) // vencido (RF14)
    .filter((c) => c.daysSince <= c.avgIntervalDays * abandonK) // não abandonado (RF17)
    .filter((c) => c.stddevDays <= c.avgIntervalDays * maxVarianceRatio) // cadência regular (RF18)
    .sort((a, b) => b.daysSince / b.avgIntervalDays - a.daysSince / a.avgIntervalDays) // mais atrasado primeiro
    .slice(0, limit) // top N (RF19)
    .map((c) => ({
      productId: c.productId,
      name: c.name,
      daysSince: Math.round(c.daysSince),
      avgIntervalDays: Math.round(c.avgIntervalDays),
      lastCompletedAt: c.lastCompletedAt,
    }));
}
