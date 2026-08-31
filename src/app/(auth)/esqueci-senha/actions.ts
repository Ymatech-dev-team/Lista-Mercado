"use server";

import { getClientIp } from "@/lib/request-ip";
import { z } from "zod";
import { findActiveUserByEmail } from "@/db/users";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { createResetToken } from "@/db/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { checkResetRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().min(1) });

export type RequestResetState = { sent?: boolean; error?: string };

export async function requestResetAction(_prev: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Digite um e-mail válido." };

  const { email } = parsed.data;

  if (!(await checkResetRateLimit(await getClientIp(), email))) {
    return { error: "Muitas tentativas. Tente novamente em alguns minutos." };
  }

  // Só envia se a conta existir — MAS a resposta é sempre a mesma (anti-enumeração, §4).
  const user = await findActiveUserByEmail(email);
  if (user) {
    const token = generateToken();
    await createResetToken(user.id, hashToken(token), new Date(Date.now() + 30 * 60 * 1000));
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail(email, `${appUrl}/redefinir-senha?token=${token}`);
  }

  return { sent: true };
}
