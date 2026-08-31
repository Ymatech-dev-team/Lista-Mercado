// Normalização de nome de produto (design.md §2): chave canônica por usuário.
// "Arroz", "arroz ", "ARROZ", "Açúcar"/"acucar" → mesma chave. Sem NLP: só limpeza determinística.
export function normalizeProductName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos (marcas combinantes)
    .replace(/\s+/g, " "); // colapsa espaços
}

// Nome que o usuário vê (preserva o que ele digitou, só apara excesso de espaço).
export function cleanDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
