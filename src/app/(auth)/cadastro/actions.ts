"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { signupSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { findActiveUserByEmail, createUser } from "@/db/users";
import { createEmailVerificationToken } from "@/db/email-verification";
import { sendVerificationEmail, sendAccountExistsEmail } from "@/lib/email/send";
import { checkSignupRateLimit } from "@/lib/rate-limit";

const PRIVACY_VERSION = "2026-08-31";

export type SignupState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string; consent?: string };
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    consent: formData.get("consent") != null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { email, password } = parsed.data;

  // Rate limit ANTES do hash e do envio (anti-spam/DoS + anti-enumeração em massa).
  if (!(await checkSignupRateLimit(await clientIp(), email))) {
    return { error: "Muitas tentativas. Tente novamente em alguns minutos." };
  }

  // Faz o hash SEMPRE — equaliza o tempo entre e-mail novo e existente (anti-timing).
  const passwordHash = await hashPassword(password);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  // Não revelamos na TELA se o e-mail já existe. Resposta é sempre a mesma
  // ("confira seu e-mail"); a diferença vai só pro e-mail apropriado.
  const existing = await findActiveUserByEmail(email);
  if (existing) {
    await sendAccountExistsEmail(email, `${appUrl}/entrar`);
    redirect("/verifique-email");
  }

  let user;
  try {
    user = await createUser({ email, passwordHash, privacyVersion: PRIVACY_VERSION });
  } catch {
    // Corrida no índice único (dois cadastros simultâneos) → trata como já-existe, silencioso.
    await sendAccountExistsEmail(email, `${appUrl}/entrar`);
    redirect("/verifique-email");
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await createEmailVerificationToken(user.id, hashToken(token), expiresAt);
  await sendVerificationEmail(email, `${appUrl}/verificar?token=${token}`);

  redirect("/verifique-email");
}
