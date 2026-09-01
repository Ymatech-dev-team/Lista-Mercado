import { describe, it, expect } from "vitest";
import { guessCategory, isCategory, aisleOrder, categoryLabel } from "./categories";

describe("guessCategory", () => {
  it("mercearia", () => expect(guessCategory("Arroz")).toBe("mercearia"));
  it("hortifrúti", () => expect(guessCategory("Banana prata")).toBe("hortifruti"));
  it("laticínios", () => expect(guessCategory("Leite integral")).toBe("laticinios"));
  it("padaria", () => expect(guessCategory("Pão de forma")).toBe("padaria"));
  it("açougue", () => expect(guessCategory("Filé de frango")).toBe("acougue"));
  it("específico vence o genérico: Água Sanitária → limpeza", () =>
    expect(guessCategory("Água Sanitária")).toBe("limpeza"));
  it("genérico: Água → bebidas", () => expect(guessCategory("Água mineral")).toBe("bebidas"));
  it("desconhecido → outros", () => expect(guessCategory("Xisto betuminoso")).toBe("outros"));
  it("acento/caixa não importam", () => expect(guessCategory("CAFÉ")).toBe("mercearia"));
});

describe("isCategory", () => {
  it("aceita chave válida", () => expect(isCategory("limpeza")).toBe(true));
  it("rejeita desconhecida", () => expect(isCategory("eletronicos")).toBe(false));
  it("rejeita não-string", () => expect(isCategory(3)).toBe(false));
});

describe("aisleOrder", () => {
  it("hortifruti antes de limpeza", () => expect(aisleOrder("hortifruti")).toBeLessThan(aisleOrder("limpeza")));
  it("desconhecida vai pro fim", () => expect(aisleOrder("zzz")).toBeGreaterThan(aisleOrder("outros") - 1));
});

describe("categoryLabel", () => {
  it("rótulo com acento", () => expect(categoryLabel("hortifruti")).toBe("Hortifrúti"));
});
