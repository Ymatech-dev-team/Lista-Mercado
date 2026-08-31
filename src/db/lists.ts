import { db } from "@/db";
import { lists } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

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
  // Conflito no índice → já existe uma ativa (criada em paralelo).
  const active = await getActiveList(userId);
  if (!active) throw new Error("Falha ao obter a lista ativa.");
  return active;
}
