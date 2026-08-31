"use server";

import { hashToken } from "@/lib/auth/tokens";
import { consumeEmailVerificationToken } from "@/db/email-verification";
import { markEmailVerified } from "@/db/users";

export type VerifyState = { ok?: boolean; error?: string };

export async function verifyEmailAction(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Link inválido." };

  const row = await consumeEmailVerificationToken(hashToken(token));
  if (!row) return { error: "Este link é inválido ou já expirou. Solicite um novo." };

  await markEmailVerified(row.userId);
  return { ok: true };
}
