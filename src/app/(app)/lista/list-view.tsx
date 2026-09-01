"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ListItem } from "@/components/ui/list-item";
import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/lib/money";
import { normalizePendingQueue, type Pending, type PendingQueue } from "@/lib/pending-queue";
import { removeItemAction, restoreItemAction } from "./actions";

export type Item = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number | null;
  isPurchased: boolean;
};

// Fila de reenvio: tipos e normalização em @/lib/pending-queue (testável).
type Queue = PendingQueue;
type Field = keyof Pending;

const TIMEOUT_MS = 8000;
const FIELDS: Field[] = ["purchased", "quantity", "priceCents"];

export function ListView({ listId, initialItems }: { listId: string; initialItems: Item[] }) {
  const pendingKey = `mm:pending:${listId}`;

  // ---- fila de reenvio persistida: sempre re-lê o localStorage antes de escrever ----
  // Normaliza o formato: versões antigas gravavam Record<id, boolean> (só "purchased"). Sem isso,
  // o `"campo" in valor` de flush/reconcile lançaria TypeError sobre um primitivo e quebraria a
  // rota /lista para quem já tinha fila pendente antes do deploy (migração de schema da fila).
  const readQueue = useCallback((): Queue => {
    try {
      return normalizePendingQueue(JSON.parse(localStorage.getItem(pendingKey) || "{}"));
    } catch {
      return {};
    }
  }, [pendingKey]);

  const writeQueue = useCallback(
    (q: Queue) => {
      try {
        localStorage.setItem(pendingKey, JSON.stringify(q));
      } catch {
        /* localStorage indisponível */
      }
    },
    [pendingKey]
  );

  const enqueue = useCallback(
    (itemId: string, patch: Pending) => {
      const q = readQueue();
      q[itemId] = { ...q[itemId], ...patch };
      writeQueue(q);
    },
    [readQueue, writeQueue]
  );

  const clearFields = useCallback(
    (itemId: string, fields: Field[]) => {
      if (!fields.length) return;
      const q = readQueue(); // re-lê: não sobrescreve edições novas feitas durante o flush
      const entry = q[itemId];
      if (!entry) return;
      for (const f of fields) delete entry[f];
      if (Object.keys(entry).length === 0) delete q[itemId];
      writeQueue(q);
    },
    [readQueue, writeQueue]
  );

  // Limpa um campo SÓ se o valor na fila ainda for o que foi enviado. Se o usuário reeditou durante
  // o await do PUT (re-enfileirando outro valor), o novo valor é preservado — evita perda de update.
  const clearFieldIfUnchanged = useCallback(
    (itemId: string, field: Field, sentValue: unknown) => {
      const q = readQueue();
      const entry = q[itemId];
      if (!entry || !(field in entry)) return;
      if (entry[field] === sentValue) {
        delete entry[field];
        if (Object.keys(entry).length === 0) delete q[itemId];
        writeQueue(q);
      }
    },
    [readQueue, writeQueue]
  );

  // Servidor é a fonte da verdade, EXCETO campos com edição local ainda pendente (design.md §6).
  const reconcile = useCallback(
    (server: Item[]): Item[] => {
      const q = readQueue();
      return server.map((it) => {
        const p = q[it.id];
        if (!p) return it;
        return {
          ...it,
          ...(p.purchased !== undefined ? { isPurchased: p.purchased } : {}),
          ...(p.quantity !== undefined ? { quantity: p.quantity } : {}),
          ...("priceCents" in p ? { unitPriceCents: p.priceCents ?? null } : {}),
        };
      });
    },
    [readQueue]
  );

  const [items, setItems] = useState<Item[]>(initialItems);
  useEffect(() => {
    setItems(reconcile(initialItems));
  }, [initialItems, reconcile]);

  // PUT de um campo, ao endpoint certo, com timeout/AbortController.
  const putField = useCallback(async (itemId: string, field: Field, value: unknown): Promise<Response> => {
    const path = field === "purchased" ? "purchased" : field === "quantity" ? "quantity" : "price";
    const body =
      field === "purchased" ? { purchased: value } : field === "quantity" ? { quantity: value } : { priceCents: value };
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      return await fetch(`/api/items/${itemId}/${path}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally {
      window.clearTimeout(t);
    }
  }, []);

  // Drena a fila. Reentrância protegida (mount + online + interval podem sobrepor).
  const flushing = useRef(false);
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      const q = readQueue();
      for (const [itemId, p] of Object.entries(q)) {
        for (const field of FIELDS) {
          if (!(field in p)) continue;
          const sent = p[field];
          try {
            const res = await putField(itemId, field, sent);
            if (res.ok) clearFieldIfUnchanged(itemId, field, sent); // não apaga valor reeditado no await
            else if (res.status === 404) clearFields(itemId, [field]); // item sumiu
            else if (res.status >= 400 && res.status < 500 && res.status !== 401) clearFields(itemId, [field]); // veneno: descarta
            // 401 (sessão) / 5xx: mantém para reenviar depois
          } catch {
            /* offline/timeout: mantém */
          }
        }
      }
    } finally {
      flushing.current = false;
    }
  }, [readQueue, clearFields, clearFieldIfUnchanged, putField]);

  useEffect(() => {
    flush();
    const onOnline = () => flush();
    window.addEventListener("online", onOnline);
    const iv = window.setInterval(flush, 15000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(iv);
    };
  }, [flush]);

  // Persiste um campo com UI otimista. Enfileira ANTES de enviar: a fila é a verdade durável, então
  // reconcile preserva a edição em voo mesmo que um revalidate chegue no meio. Limpa da fila só no
  // sucesso (e só se o valor não mudou); reverte apenas em erro semântico (4xx≠401).
  async function persistField(item: Item, field: Field, value: unknown, revert: () => void) {
    enqueue(item.id, { [field]: value });
    try {
      const res = await putField(item.id, field, value);
      if (res.ok) {
        clearFieldIfUnchanged(item.id, field, value);
        return;
      }
      if (res.status === 401) return; // sessão: fica na fila, reenvia após reautenticar
      if (res.status >= 400 && res.status < 500) {
        clearFields(item.id, [field]);
        revert();
        toast("Não foi possível atualizar esse item.");
        return;
      }
      // 5xx: transitório → fica na fila
    } catch {
      /* offline/timeout: fica na fila */
    }
  }

  function toggle(item: Item) {
    const next = !item.isPurchased;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPurchased: next } : i)));
    void persistField(item, "purchased", next, () =>
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPurchased: !next } : i)))
    );
  }

  function changeQty(item: Item, quantity: number) {
    const prev = item.quantity;
    setItems((p) => p.map((i) => (i.id === item.id ? { ...i, quantity } : i)));
    void persistField(item, "quantity", quantity, () =>
      setItems((p) => p.map((i) => (i.id === item.id ? { ...i, quantity: prev } : i)))
    );
  }

  function changePrice(item: Item, priceCents: number | null) {
    const prev = item.unitPriceCents;
    setItems((p) => p.map((i) => (i.id === item.id ? { ...i, unitPriceCents: priceCents } : i)));
    void persistField(item, "priceCents", priceCents, () =>
      setItems((p) => p.map((i) => (i.id === item.id ? { ...i, unitPriceCents: prev } : i)))
    );
  }

  async function remove(item: Item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id)); // otimista
    const removed = await removeItemAction(item.id);
    if (!removed) {
      setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
      toast("Não foi possível remover o item.");
      return;
    }
    toast(`${item.name} removido`, {
      action: {
        label: "Desfazer",
        onClick: () => {
          void restoreItemAction(removed);
          setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
        },
      },
    });
  }

  const done = items.filter((i) => i.isPurchased).length;
  const missing = items.filter((i) => i.unitPriceCents == null).length;
  const totalCents = items.reduce((s, i) => s + (i.unitPriceCents ?? 0) * i.quantity, 0);

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">Sua lista está vazia. Adicione o primeiro item acima.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">no carrinho</span>
        <span className="font-[family-name:var(--font-num)] tabular-nums text-xs font-medium text-primary-strong">
          {done}/{items.length}
        </span>
      </div>
      <Progress value={(done / items.length) * 100} className="mb-3" />
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <ListItem
              name={it.name}
              quantity={it.quantity}
              unitPriceCents={it.unitPriceCents}
              checked={it.isPurchased}
              onToggle={() => toggle(it)}
              onRemove={() => remove(it)}
              onQuantityChange={(q) => changeQty(it, q)}
              onPriceChange={(c) => changePrice(it, c)}
            />
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
        <span className="text-[11px] uppercase tracking-[0.09em] text-muted">
          {missing > 0 ? (
            <>total parcial · <span className="text-warning">{missing} sem preço</span></>
          ) : (
            "total"
          )}
        </span>
        <span className="font-[family-name:var(--font-num)] tabular-nums text-lg font-medium text-ink">{formatBRL(totalCents)}</span>
      </div>
    </div>
  );
}
