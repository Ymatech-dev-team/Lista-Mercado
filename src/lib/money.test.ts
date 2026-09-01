import { describe, it, expect } from "vitest";
import { parseBRLToCents, formatBRL, PRICE_MAX_CENTS } from "./money";

describe("parseBRLToCents", () => {
  it("vírgula decimal", () => expect(parseBRLToCents("12,90")).toBe(1290));
  it("milhar + decimal", () => expect(parseBRLToCents("1.234,50")).toBe(123450));
  it("ponto como decimal", () => expect(parseBRLToCents("12.90")).toBe(1290));
  it("reais inteiro", () => expect(parseBRLToCents("12")).toBe(1200));
  it("tira o R$", () => expect(parseBRLToCents("R$ 12,90")).toBe(1290));
  it("zero explícito é válido", () => expect(parseBRLToCents("0")).toBe(0));
  it("sem drift de float (0,10)", () => expect(parseBRLToCents("0,10")).toBe(10));
  it("sem drift de float (0,29)", () => expect(parseBRLToCents("0,29")).toBe(29));
  it("rejeita letras", () => expect(parseBRLToCents("abc")).toBeNull());
  it("rejeita vazio", () => expect(parseBRLToCents("")).toBeNull());
  it("rejeita negativo", () => expect(parseBRLToCents("-5")).toBeNull());
  it("rejeita acima do teto", () => expect(parseBRLToCents("100000")).toBeNull());
});

describe("formatBRL", () => {
  it("centavos", () => expect(formatBRL(1290)).toBe("R$ 12,90"));
  it("milhar", () => expect(formatBRL(123450)).toBe("R$ 1.234,50"));
  it("zero", () => expect(formatBRL(0)).toBe("R$ 0,00"));
  it("teto formata", () => expect(formatBRL(PRICE_MAX_CENTS)).toBe("R$ 99.999,99"));
});
