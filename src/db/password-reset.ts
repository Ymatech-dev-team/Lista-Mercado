import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";

export async function createResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  // Invalida tokens de reset pendentes anteriores do mesmo usuário.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
  await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
}

// Consumo atômico single-use: só marca used_at se não usado E não expirado.
export async function consumeResetToken(tokenHash: string) {
  const now = new Date();
  const [row] = await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .returning();
  return row ?? null;
}
