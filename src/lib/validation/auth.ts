import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => emailRegex.test(v), "Digite um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha precisa ter ao menos 8 caracteres.")
    .max(200, "Senha muito longa."),
  consent: z.boolean().refine((v) => v === true, "Aceite a política de privacidade para continuar."),
});

export type SignupInput = z.infer<typeof signupSchema>;

// Login: mensagens genéricas (anti-enumeração) — nunca dizer qual campo errou.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

// Redefinição de senha: mesma regra de força do cadastro.
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "A senha precisa ter ao menos 8 caracteres.")
    .max(200, "Senha muito longa."),
});
