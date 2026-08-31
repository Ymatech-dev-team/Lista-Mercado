// Formata data em pt-BR (ex.: "31 de agosto de 2026"). Usado só em Server Components
// (sem risco de hydration mismatch de locale).
export function formatDatePt(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}
