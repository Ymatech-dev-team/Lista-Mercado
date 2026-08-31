"use server";

import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { consumeResetToken } from "@/db/password-reset";
import { updateUserPassword } from "@/db/users";
import { deleteAllUserSessions } from "@/db/sessions";

export type ResetState = { ok?: boolean; error?: string };

export async function resetPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Senha inválida." };
  if (!token) return { error: "Link inválido." };

  const row = await consumeResetToken(hashToken(token));
  if (!row) return { error: "Este link é inválido ou já expirou. Solicite um novo." };

  await updateUserPassword(row.userId, await hashPassword(parsed.data.password));
  await deleteAllUserSessions(row.userId); // derruba todas as sessões (design.md §4)

  return { ok: true };
}
