import { describe, it, expect } from "vitest";
import { priceCentsSchema, budgetCentsSchema, PRICE_MAX_CENTS } from "./list";

describe("priceCentsSchema", () => {
  it("aceita 0 (de graça)", () => expect(priceCentsSchema.safeParse(0).success).toBe(true));
  it("aceita centavos válidos", () => expect(priceCentsSchema.safeParse(1290).success).toBe(true));
  it("aceita o teto", () => expect(priceCentsSchema.safeParse(PRICE_MAX_CENTS).success).toBe(true));
  it("rejeita não-inteiro", () => expect(priceCentsSchema.safeParse(10.5).success).toBe(false));
  it("rejeita negativo", () => expect(priceCentsSchema.safeParse(-1).success).toBe(false));
  it("rejeita acima do teto", () => expect(priceCentsSchema.safeParse(PRICE_MAX_CENTS + 1).success).toBe(false));
  it("não coage string (sem .catch)", () => expect(priceCentsSchema.safeParse("1290").success).toBe(false));
});

describe("budgetCentsSchema", () => {
  it("rejeita 0 (teto zero não faz sentido)", () => expect(budgetCentsSchema.safeParse(0).success).toBe(false));
  it("aceita positivo", () => expect(budgetCentsSchema.safeParse(50000).success).toBe(true));
  it("rejeita negativo", () => expect(budgetCentsSchema.safeParse(-1).success).toBe(false));
});
