import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

// Camada de acesso a usuários. E-mail é sempre guardado normalizado (minúsculas).

export async function findActiveUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUser(input: { email: string; passwordHash: string; privacyVersion: string }) {
  const [row] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash: input.passwordHash,
      consentAt: new Date(),
      privacyVersion: input.privacyVersion,
    })
    .returning();
  return row;
}

// Teto de gasto mensal (centavos, ou null = sem teto). RF26.
export async function getMonthlyBudgetCents(userId: string): Promise<number | null> {
  const [row] = await db.select({ b: users.monthlyBudgetCents }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.b ?? null;
}

export async function setMonthlyBudgetCents(userId: string, cents: number | null) {
  await db.update(users).set({ monthlyBudgetCents: cents, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function markEmailVerified(userId: string) {
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// LGPD — exclusão de conta. As FKs são ON DELETE CASCADE a partir de users, então apagar
// a linha do usuário apaga em cascata: sessions, tokens, products, lists, list_items.
export async function deleteUserAccount(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
