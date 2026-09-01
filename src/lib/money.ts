// Dinheiro em CENTAVOS INTEIROS (design.md RNF1). Nunca float no cálculo; formatação só na borda.

export const PRICE_MAX_CENTS = 9_999_999; // R$ 99.999,99 — teto de sanidade (RNF4)

// Formata centavos como moeda BR. O Intl insere um espaço fino (U+00A0/U+202F) entre "R$" e o
// número; \s cobre esses caracteres e normalizamos para espaço comum, deixando "R$ 12,90"
// estável e comparável em teste.
export function formatBRL(cents: number): string {
  return (cents / 100)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\s/g, " ");
}

// Converte texto digitado pelo usuário (BR) em centavos inteiros, ou null se inválido.
// Regras: "." = milhar e "," = decimal quando ambos presentes; "," sozinha = decimal;
// aceita "." sozinho como decimal (uso comum em campo de preço). Rejeita negativo, vazio,
// não-numérico e acima do teto.
export function parseBRLToCents(input: string): number | null {
  if (typeof input !== "string") return null;
  let s = input.trim().replace(/^R\$\s?/i, "").replace(/\s/g, "");
  if (s === "" || !/^[0-9.,]+$/.test(s)) return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    s = s.replace(/\./g, "").replace(",", "."); // ponto = milhar, vírgula = decimal
  } else if (hasComma) {
    s = s.replace(",", ".");
  }

  const value = Number(s);
  if (!Number.isFinite(value) || value < 0) return null;
  const cents = Math.round(value * 100); // Math.round corrige o drift binário de value*100
  if (cents > PRICE_MAX_CENTS) return null;
  return cents;
}
