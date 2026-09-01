// Fila de reenvio offline por item (design.md §6). Um item pode ter marcação, quantidade e/ou
// preço pendentes. Persistida em localStorage; ver list-view.tsx.
export type Pending = { purchased?: boolean; quantity?: number; priceCents?: number | null };
export type PendingQueue = Record<string, Pending>;

// Normaliza/migra o formato lido do localStorage. Versões antigas gravavam Record<id, boolean>
// (só "purchased"); sem esta conversão, o `"campo" in valor` de flush/reconcile lançaria TypeError
// sobre um primitivo e quebraria a rota /lista para quem já tinha fila pendente antes do deploy.
export function normalizePendingQueue(raw: unknown): PendingQueue {
  if (!raw || typeof raw !== "object") return {};
  const out: PendingQueue = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "boolean") {
      out[id] = { purchased: v }; // formato antigo
      continue;
    }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const p: Pending = {};
      if (typeof o.purchased === "boolean") p.purchased = o.purchased;
      if (typeof o.quantity === "number") p.quantity = o.quantity;
      if ("priceCents" in o && (o.priceCents === null || typeof o.priceCents === "number")) {
        p.priceCents = o.priceCents as number | null;
      }
      if (Object.keys(p).length) out[id] = p;
    }
  }
  return out;
}
