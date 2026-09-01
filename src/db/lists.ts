import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

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

// Total de itens comprados em listas concluídas NESTE mês (stat da Home).
export async function getItemsPurchasedThisMonth(userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listItems)
    .innerJoin(lists, eq(lists.id, listItems.listId))
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.status, "completed"),
        eq(listItems.isPurchased, true),
        sql`${lists.completedAt} >= date_trunc('month', now())`
      )
    );
  return row?.n ?? 0;
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
