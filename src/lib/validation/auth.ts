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
