import { normalizeProductName } from "@/lib/products/normalize";

// Combos comuns do mercado brasileiro. Chave = nome normalizado; valores = sugestões (display).
const COMBOS: Record<string, string[]> = {
  arroz: ["Feijão", "Óleo", "Sal"],
  feijao: ["Arroz", "Óleo", "Alho"],
  cafe: ["Açúcar", "Leite", "Pão"],
  leite: ["Café", "Achocolatado", "Pão"],
  pao: ["Manteiga", "Presunto", "Queijo"],
  macarrao: ["Molho de tomate", "Queijo ralado"],
  "molho de tomate": ["Macarrão", "Cebola"],
  carne: ["Alho", "Cebola", "Sal"],
  frango: ["Alho", "Batata", "Arroz"],
  ovos: ["Pão", "Óleo"],
  acucar: ["Café", "Farinha de trigo"],
  detergente: ["Esponja", "Sabão em pó"],
  "sabao em po": ["Amaciante", "Detergente"],
  cerveja: ["Carvão", "Gelo"],
  "papel higienico": ["Sabonete", "Shampoo"],
};

// Sugestões curadas a partir dos itens já na lista.
export function getCuratedSuggestions(activeDisplayNames: string[]): string[] {
  const out: string[] = [];
  for (const name of activeDisplayNames) {
    const combos = COMBOS[normalizeProductName(name)];
    if (combos) out.push(...combos);
  }
  return out;
}
