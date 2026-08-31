"use server";

import { redirect } from "next/navigation";
import { getClientIp } from "@/lib/request-ip";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword, getDummyHash } from "@/lib/auth/password";
import { findActiveUserByEmail } from "@/db/users";
import { createSession } from "@/lib/auth/session";
import { checkLoginRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string; needsVerification?: boolean };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "E-mail ou senha inválidos." };

  const { email, password } = parsed.data;

  if (!(await checkLoginRateLimit(await getClientIp(), email))) {
    return { error: "Muitas tentativas. Tente novamente em alguns minutos." };
  }

  const user = await findActiveUserByEmail(email);
  // Timing-safe: verifica SEMPRE (hash isca se o e-mail não existe) — anti-enumeração.
  const hash = user?.passwordHash ?? (await getDummyHash());
  const ok = await verifyPassword(hash, password);

  if (!user || !ok) return { error: "E-mail ou senha inválidos." };

  // Gate D8/§4: conta não-verificada não entra.
  if (!user.emailVerifiedAt) {
    return {
      needsVerification: true,
      error: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
    };
  }

  await createSession(user.id);
  redirect("/");
}
