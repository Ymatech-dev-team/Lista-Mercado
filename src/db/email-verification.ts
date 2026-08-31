import { db } from "@/db";
import { emailVerificationTokens } from "@/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";

export async function createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
  await db.insert(emailVerificationTokens).values({ userId, tokenHash, expiresAt });
}

// Consumo atômico e de uso único: só marca used_at se ainda não usado E não expirado.
// Retorna a linha (com user_id) se válido; null se inválido/expirado/já usado.
export async function consumeEmailVerificationToken(tokenHash: string) {
  const now = new Date();
  const [row] = await db
    .update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, now)
      )
    )
    .returning();
  return row ?? null;
}
