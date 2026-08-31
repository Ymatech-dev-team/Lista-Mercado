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

export async function markEmailVerified(userId: string) {
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}
