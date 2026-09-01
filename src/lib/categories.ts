import { normalizeProductName } from "@/lib/products/normalize";

// FONTE ÚNICA da verdade das categorias (design.md ADR-2): a ordem do array = ordem de corredor;
// `key` bate com o CHECK do banco; `label` é a exibição; o dicionário abaixo dá o palpite.
export const CATEGORIES = [
  { key: "hortifruti", label: "Hortifrúti" },
  { key: "padaria", label: "Padaria" },
  { key: "acougue", label: "Açougue" },
  { key: "laticinios", label: "Laticínios" },
  { key: "mercearia", label: "Mercearia" },
  { key: "bebidas", label: "Bebidas" },
  { key: "congelados", label: "Congelados" },
  { key: "limpeza", label: "Limpeza" },
  { key: "higiene", label: "Higiene" },
  { key: "outros", label: "Outros" },
] as const;

export type Category = (typeof CATEGORIES)[number]["key"];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as Category[];

export function isCategory(x: unknown): x is Category {
  return typeof x === "string" && (CATEGORY_KEYS as string[]).includes(x);
}

export function categoryLabel(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? "Outros";
}

// Índice de corredor (para ordenar seções). Categoria desconhecida vai pro fim.
export function aisleOrder(key: string): number {
  const i = (CATEGORY_KEYS as string[]).indexOf(key);
  return i === -1 ? CATEGORY_KEYS.length : i;
}

// Dicionário de palpite: token → categoria. Tokens normalizados como o nome do produto e ordenados
// por comprimento DESC (o mais específico vence: "agua sanitaria" antes de "agua").
const GUESS: [string, Category][] = [
  ["banana", "hortifruti"], ["maca", "hortifruti"], ["tomate", "hortifruti"], ["alface", "hortifruti"],
  ["cebola", "hortifruti"], ["batata", "hortifruti"], ["cenoura", "hortifruti"], ["laranja", "hortifruti"],
  ["limao", "hortifruti"], ["mamao", "hortifruti"], ["manga", "hortifruti"], ["uva", "hortifruti"], ["alho", "hortifruti"],
  ["pao", "padaria"], ["bolo", "padaria"], ["biscoito", "padaria"], ["bolacha", "padaria"], ["torrada", "padaria"],
  ["carne", "acougue"], ["frango", "acougue"], ["file", "acougue"], ["linguica", "acougue"], ["bife", "acougue"],
  ["costela", "acougue"], ["peito", "acougue"], ["salsicha", "acougue"],
  ["leite", "laticinios"], ["queijo", "laticinios"], ["iogurte", "laticinios"], ["manteiga", "laticinios"],
  ["requeijao", "laticinios"], ["presunto", "laticinios"], ["mussarela", "laticinios"], ["nata", "laticinios"],
  ["arroz", "mercearia"], ["feijao", "mercearia"], ["oleo", "mercearia"], ["acucar", "mercearia"], ["sal", "mercearia"],
  ["cafe", "mercearia"], ["macarrao", "mercearia"], ["farinha", "mercearia"], ["molho", "mercearia"], ["extrato", "mercearia"],
  ["vinagre", "mercearia"], ["milho", "mercearia"], ["ervilha", "mercearia"], ["atum", "mercearia"], ["sardinha", "mercearia"],
  ["refrigerante", "bebidas"], ["cerveja", "bebidas"], ["agua sanitaria", "limpeza"], ["agua", "bebidas"],
  ["suco", "bebidas"], ["refresco", "bebidas"], ["vinho", "bebidas"], ["energetico", "bebidas"],
  ["sorvete", "congelados"], ["congelado", "congelados"], ["nuggets", "congelados"], ["pizza", "congelados"], ["hamburguer", "congelados"],
  ["sabao", "limpeza"], ["detergente", "limpeza"], ["amaciante", "limpeza"], ["desinfetante", "limpeza"],
  ["esponja", "limpeza"], ["alvejante", "limpeza"], ["multiuso", "limpeza"],
  ["sabonete", "higiene"], ["shampoo", "higiene"], ["condicionador", "higiene"], ["pasta de dente", "higiene"],
  ["creme dental", "higiene"], ["papel higienico", "higiene"], ["fralda", "higiene"], ["absorvente", "higiene"],
  ["desodorante", "higiene"], ["escova", "higiene"],
];

const GUESS_SORTED: [string, Category][] = GUESS.map(([t, c]) => [normalizeProductName(t), c] as [string, Category]).sort(
  (a, b) => b[0].length - a[0].length
);

// Palpite de categoria a partir do nome. Sem match → "outros".
export function guessCategory(rawName: string): Category {
  const n = normalizeProductName(rawName);
  for (const [token, cat] of GUESS_SORTED) {
    if (n.includes(token)) return cat;
  }
  return "outros";
}
