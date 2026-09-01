import { describe, it, expect } from "vitest";
import { guessCategory, isCategory, aisleOrder, categoryLabel, groupByCategory } from "./categories";

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
  // compostos "preparo de <ingrediente>": o substantivo lidera, não o ingrediente
  it("molho de tomate → mercearia (não hortifrúti)", () => expect(guessCategory("Molho de tomate")).toBe("mercearia"));
  it("suco de laranja → bebidas (não hortifrúti)", () => expect(guessCategory("Suco de laranja")).toBe("bebidas"));
  it("bolo de cenoura → padaria (não hortifrúti)", () => expect(guessCategory("Bolo de cenoura")).toBe("padaria"));
  // substring não engana: palavra inteira
  it("salsicha → açougue (não 'sal'→mercearia)", () => expect(guessCategory("Salsicha")).toBe("acougue"));
  it("salada → hortifrúti (não 'sal'→mercearia)", () => expect(guessCategory("Salada pronta")).toBe("hortifruti"));
  // plural simples
  it("plural: Bananas → hortifrúti", () => expect(guessCategory("Bananas")).toBe("hortifruti"));
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

describe("groupByCategory", () => {
  const items = [
    { id: "1", category: "limpeza" },
    { id: "2", category: "hortifruti" },
    { id: "3", category: "limpeza" },
    { id: "4", category: "mercearia" },
  ];
  it("ordena seções pela ordem de corredor", () =>
    expect(groupByCategory(items).map((g) => g.key)).toEqual(["hortifruti", "mercearia", "limpeza"]));
  it("preserva a ordem dos itens dentro da seção", () =>
    expect(groupByCategory(items).find((g) => g.key === "limpeza")!.items.map((i) => i.id)).toEqual(["1", "3"]));
  it("omite seções vazias (só as presentes)", () =>
    expect(groupByCategory(items)).toHaveLength(3));
  it("categoria desconhecida cai em outros", () =>
    expect(groupByCategory([{ id: "x", category: "eletronicos" }])[0].key).toBe("outros"));
  it("lista vazia → sem seções", () => expect(groupByCategory([])).toEqual([]));
});
