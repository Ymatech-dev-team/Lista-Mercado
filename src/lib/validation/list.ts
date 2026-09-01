import { z } from "zod";

export const addItemSchema = z.object({
  name: z.string().trim().min(1, "Digite o nome do item.").max(80, "Nome muito longo (máx. 80)."),
  // Coerção tolerante: vazio/inválido/0/negativo → 1 (design.md RF3).
  quantity: z.coerce.number().int().min(1).max(9999).catch(1),
});

// Dinheiro: centavos inteiros, SEM .catch (design.md RNF4 — rejeita, não coage silenciosamente).
// Preço aceita 0 ("de graça"); teto de gasto exige valor positivo.
export const PRICE_MAX_CENTS = 9_999_999; // R$ 99.999,99
export const priceCentsSchema = z.number().int().min(0).max(PRICE_MAX_CENTS);
export const budgetCentsSchema = z.number().int().min(1).max(PRICE_MAX_CENTS);
