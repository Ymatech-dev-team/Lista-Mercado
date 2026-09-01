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
  ["banana", "hortifruti"], ["maca", "hortifruti"], ["tomate", "hortifruti"], ["alface", "hortifruti"], ["salada", "hortifruti"],
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

const GUESS_NORM = GUESS.map(([t, c]) => [normalizeProductName(t), c] as [string, Category]);
// Tokens compostos ("agua sanitaria", "pasta de dente") — mais específicos, por substring, maiores 1º.
const MULTI_WORD = GUESS_NORM.filter(([t]) => t.includes(" ")).sort((a, b) => b[0].length - a[0].length);
// Tokens de uma palavra — casados por palavra INTEIRA (não substring); primeiro registro vence.
const SINGLE_WORD = new Map<string, Category>();
for (const [t, c] of GUESS_NORM) if (!t.includes(" ") && !SINGLE_WORD.has(t)) SINGLE_WORD.set(t, c);

// Agrupa itens por categoria, ordenando as seções pela ordem de corredor e preservando a ordem
// dos itens dentro de cada seção (design.md RNF5). Seção vazia é omitida. Categoria fora da união
// cai em "outros" (defensivo — o CHECK já garante no banco).
export function groupByCategory<T extends { category: string }>(
  items: T[]
): { key: Category; label: string; items: T[] }[] {
  const buckets = new Map<Category, T[]>();
  for (const it of items) {
    const k: Category = isCategory(it.category) ? it.category : "outros";
    const arr = buckets.get(k);
    if (arr) arr.push(it);
    else buckets.set(k, [it]);
  }
  return CATEGORIES.filter((c) => buckets.has(c.key)).map((c) => ({
    key: c.key,
    label: c.label,
    items: buckets.get(c.key)!,
  }));
}

// Palpite de categoria a partir do nome. Sem match → "outros".
// (1) tokens compostos por substring; (2) palavra a palavra NA ORDEM do nome — o substantivo
// costuma liderar ("molho de tomate" → mercearia, não hortifrúti), casando palavra inteira (+ plural
// simples) para evitar falso-positivo de substring ("sal" dentro de "salada").
export function guessCategory(rawName: string): Category {
  const n = normalizeProductName(rawName);
  for (const [token, cat] of MULTI_WORD) if (n.includes(token)) return cat;
  for (const w of n.split(" ")) {
    const cat =
      SINGLE_WORD.get(w) ??
      (w.endsWith("s") ? SINGLE_WORD.get(w.slice(0, -1)) : undefined) ??
      (w.endsWith("es") ? SINGLE_WORD.get(w.slice(0, -2)) : undefined);
    if (cat) return cat;
  }
  return "outros";
}
