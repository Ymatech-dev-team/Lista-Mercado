import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

// Fronteira de mês no fuso do usuário (design.md ADR-4). now() é UTC; truncar em UTC joga compras
// do fim do mês à noite (BRT) pro mês seguinte. Comparamos completed_at e o início do mês ambos
// convertidos para o horário de Brasília.
const thisMonthSP = sql`${lists.completedAt} at time zone 'America/Sao_Paulo' >= date_trunc('month', now() at time zone 'America/Sao_Paulo')`;

// Soma preço×qtd em CENTAVOS. Multiplica em bigint (quantity*price pode passar de int4: 9999 * 9.999.999).
const purchasedCents = sql<string>`coalesce(sum((${listItems.quantity})::bigint * ${listItems.unitPriceCents}) filter (where ${listItems.isPurchased} and ${listItems.unitPriceCents} is not null), 0)`;

export async function getActiveList(userId: string) {
  const [row] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.status, "active"), isNull(lists.deletedAt)))
    .limit(1);
  return row ?? null;
}

// Idempotente: se duas requisições correrem, o índice único parcial (1 ativa/usuário) barra a 2ª.
export async function getOrCreateActiveList(userId: string) {
  const existing = await getActiveList(userId);
  if (existing) return existing;
  const inserted = await db.insert(lists).values({ userId, status: "active" }).onConflictDoNothing().returning();
  if (inserted[0]) return inserted[0];
  const active = await getActiveList(userId);
  if (!active) throw new Error("Falha ao obter a lista ativa.");
  return active;
}

// Conclui a lista ativa (atômico e idempotente): só afeta se ainda está ativa. design.md RF5.
export async function completeActiveList(userId: string) {
  const [row] = await db
    .update(lists)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(lists.userId, userId), eq(lists.status, "active"), isNull(lists.deletedAt)))
    .returning();
  return row ?? null;
}

// Histórico: listas concluídas com resumo (total de itens e quantos foram comprados).
export async function getCompletedLists(userId: string) {
  return db
    .select({
      id: lists.id,
      completedAt: lists.completedAt,
      total: sql<number>`count(${listItems.id})::int`,
      comprados: sql<number>`count(*) filter (where ${listItems.isPurchased})::int`,
    })
    .from(lists)
    .leftJoin(listItems, eq(listItems.listId, lists.id))
    .where(and(eq(lists.userId, userId), eq(lists.status, "completed"), isNull(lists.deletedAt)))
    .groupBy(lists.id, lists.completedAt)
    .orderBy(desc(lists.completedAt));
}

// Total de itens comprados em listas concluídas NESTE mês (stat da Home). Fuso corrigido (D4).
export async function getItemsPurchasedThisMonth(userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listItems)
    .innerJoin(lists, eq(lists.id, listItems.listId))
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.status, "completed"),
        isNull(lists.deletedAt),
        eq(listItems.isPurchased, true),
        thisMonthSP
      )
    );
  return row?.n ?? 0;
}

// Gasto (centavos) em listas concluídas neste mês — escopado por userId (RF18). Fuso corrigido (RF19/D4).
export async function getMonthlySpendCents(userId: string): Promise<number> {
  const [row] = await db
    .select({ cents: purchasedCents })
    .from(listItems)
    .innerJoin(lists, eq(lists.id, listItems.listId))
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.status, "completed"),
        isNull(lists.deletedAt),
        isNotNull(listItems.unitPriceCents),
        thisMonthSP
      )
    );
  return Number(row?.cents ?? 0);
}

// Total (centavos) da última compra concluída, para comparação (RF20). null se não há base
// comparável (sem lista concluída ou sem preço registrado — evita divisão por zero, RF23).
export async function getLastCompletedTotalCents(userId: string): Promise<number | null> {
  const [row] = await db
    .select({ id: lists.id, cents: purchasedCents })
    .from(lists)
    .leftJoin(listItems, eq(listItems.listId, lists.id))
    .where(and(eq(lists.userId, userId), eq(lists.status, "completed"), isNull(lists.deletedAt)))
    .groupBy(lists.id, lists.completedAt)
    .orderBy(desc(lists.completedAt))
    .limit(1);
  if (!row) return null;
  const cents = Number(row.cents);
  return cents > 0 ? cents : null;
}

export async function getCompletedListById(userId: string, listId: string) {
  const [row] = await db
    .select({ id: lists.id, completedAt: lists.completedAt })
    .from(lists)
    .where(
      and(
        eq(lists.id, listId),
        eq(lists.userId, userId),
        eq(lists.status, "completed"),
        isNull(lists.deletedAt)
      )
    )
    .limit(1);
  return row ?? null;
}
