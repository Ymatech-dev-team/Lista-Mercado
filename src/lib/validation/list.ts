import { z } from "zod";

export const addItemSchema = z.object({
  name: z.string().trim().min(1, "Digite o nome do item.").max(80, "Nome muito longo (máx. 80)."),
  // Coerção tolerante: vazio/inválido/0/negativo → 1 (design.md RF3).
  quantity: z.coerce.number().int().min(1).max(9999).catch(1),
});
