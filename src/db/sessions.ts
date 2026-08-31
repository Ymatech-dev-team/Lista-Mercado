import { db } from "@/db";
import { sessions } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";

export async function insertSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  absoluteExpiresAt: Date
) {
  await db.insert(sessions).values({ userId, tokenHash, expiresAt, absoluteExpiresAt });
}

// Sessão válida = existe, não expirou (deslizante) E não passou do teto absoluto.
export async function findValidSession(tokenHash: string) {
  const now = new Date();
  const [row] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, now),
        gt(sessions.absoluteExpiresAt, now)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function slideSession(tokenHash: string, newExpiresAt: Date) {
  await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.tokenHash, tokenHash));
}

export async function deleteSessionByHash(tokenHash: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function deleteAllUserSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
