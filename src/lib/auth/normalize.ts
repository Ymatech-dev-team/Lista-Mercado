// Normalização de e-mail para deduplicação e login (chave única em minúsculas).
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
