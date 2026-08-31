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
