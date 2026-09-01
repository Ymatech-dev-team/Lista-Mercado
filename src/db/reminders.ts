import { db } from "@/db";
import { sql } from "drizzle-orm";
import type { ReminderCandidate } from "@/lib/reminders";

// Candidatos a lembrete: por produto com ≥2 compras concluídas (isPurchased), o intervalo médio e a
// dispersão entre compras (lag sobre completed_at) + dias desde a última. Escopado por userId
// (anti-IDOR, parametrizado). Exclui produtos já na lista ativa e soft-deletados (RF16/RF22).
// A decisão de elegibilidade fica em lib/reminders.pickReminders (pura, testável).
export async function getRepurchaseCandidates(userId: string): Promise<ReminderCandidate[]> {
  const query = sql`
    with bought as (
      select li.product_id, l.completed_at
      from list_items li
      join lists l on l.id = li.list_id
      where l.user_id = ${userId} and l.status = 'completed' and l.deleted_at is null and li.is_purchased = true
      group by li.product_id, l.id, l.completed_at
    ),
    diffs as (
      select product_id, completed_at,
        extract(epoch from (completed_at - lag(completed_at) over (partition by product_id order by completed_at))) / 86400.0 as gap_days
      from bought
    )
    select d.product_id as "productId",
           p.display_name as "name",
           count(d.gap_days)::int as "intervals",
           avg(d.gap_days)::float8 as "avgIntervalDays",
           coalesce(stddev_pop(d.gap_days), 0)::float8 as "stddevDays",
           (extract(epoch from (now() - max(d.completed_at))) / 86400.0)::float8 as "daysSince",
           max(d.completed_at) as "lastCompletedAt"
    from diffs d
    join products p on p.id = d.product_id
    where p.deleted_at is null
      and d.product_id not in (
        select li2.product_id from list_items li2
        join lists l2 on l2.id = li2.list_id
        where l2.user_id = ${userId} and l2.status = 'active' and l2.deleted_at is null
      )
    group by d.product_id, p.display_name
    having count(d.gap_days) >= 1
  `;
  const result = await db.execute(query);
  const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows) ?? [];
  return (rows as Record<string, unknown>[]).map((r) => ({
    productId: String(r.productId),
    name: String(r.name),
    intervals: Number(r.intervals),
    avgIntervalDays: Number(r.avgIntervalDays),
    stddevDays: Number(r.stddevDays),
    daysSince: Number(r.daysSince),
    lastCompletedAt: new Date(r.lastCompletedAt as string | number | Date).toISOString(),
  }));
}
