"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ListItem } from "@/components/ui/list-item";
import { Progress } from "@/components/ui/progress";
import { removeItemAction, restoreItemAction } from "./actions";

export type Item = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  isPurchased: boolean;
};

const TIMEOUT_MS = 8000;

export function ListView({ listId, initialItems }: { listId: string; initialItems: Item[] }) {
  const pendingKey = `mm:pending:${listId}`;

  // ---- fila de reenvio persistida (design.md §3): sempre re-lê o localStorage antes de escrever ----
  const readQueue = useCallback((): Record<string, boolean> => {
    try {
      return JSON.parse(localStorage.getItem(pendingKey) || "{}");
    } catch {
      return {};
    }
  }, [pendingKey]);

  const writeQueue = useCallback(
    (q: Record<string, boolean>) => {
      try {
        localStorage.setItem(pendingKey, JSON.stringify(q));
      } catch {
        /* localStorage indisponível */
      }
    },
    [pendingKey]
  );

  const enqueue = useCallback(
    (itemId: string, purchased: boolean) => {
      const q = readQueue();
      q[itemId] = purchased;
      writeQueue(q);
    },
    [readQueue, writeQueue]
  );

  const dequeue = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      const q = readQueue(); // re-lê: não sobrescreve marcações novas feitas durante o flush
      for (const id of ids) delete q[id];
      writeQueue(q);
    },
    [readQueue, writeQueue]
  );

  // Servidor é a fonte da verdade, EXCETO itens com marcação local ainda pendente (design.md §3).
  const reconcile = useCallback(
    (server: Item[]): Item[] => {
      const q = readQueue();
      return server.map((it) => (it.id in q ? { ...it, isPurchased: q[it.id] } : it));
    },
    [readQueue]
  );

  const [items, setItems] = useState<Item[]>(initialItems);
  useEffect(() => {
    setItems(reconcile(initialItems));
  }, [initialItems, reconcile]);

  // PUT com timeout/AbortController (design.md §3).
  async function putOnce(itemId: string, purchased: boolean): Promise<Response> {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      return await fetch(`/api/items/${itemId}/purchased`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purchased }),
        signal: ctrl.signal,
      });
    } finally {
      window.clearTimeout(t);
    }
  }

  // Drena a fila. Reentrância protegida (mount + online + interval podem sobrepor).
  const flushing = useRef(false);
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      const q = readQueue();
      const done: string[] = [];
      for (const [itemId, purchased] of Object.entries(q)) {
        try {
          const res = await putOnce(itemId, purchased);
          if (res.ok || res.status === 404) done.push(itemId); // ok, ou item já não existe
          // 401 (sessão) / 5xx: mantém na fila para reenviar depois
        } catch {
          /* offline/timeout: mantém */
        }
      }
      dequeue(done);
    } finally {
      flushing.current = false;
    }
  }, [readQueue, dequeue]);

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

  async function toggle(item: Item) {
    const next = !item.isPurchased;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPurchased: next } : i))); // otimista
    try {
      const res = await putOnce(item.id, next);
      if (res.ok) return;
      if (res.status === 401) {
        enqueue(item.id, next); // sessão expirou: preserva e reenvia após reautenticar (design.md §5)
        return;
      }
      if (res.status >= 400 && res.status < 500) {
        // erro semântico → reverte
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPurchased: !next } : i)));
        toast("Não foi possível atualizar esse item.");
        return;
      }
      enqueue(item.id, next); // 5xx: transitório
    } catch {
      enqueue(item.id, next); // offline/timeout: mantém e reenvia
    }
  }

  async function putQuantity(itemId: string, quantity: number): Promise<Response> {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      return await fetch(`/api/items/${itemId}/quantity`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity }),
        signal: ctrl.signal,
      });
    } finally {
      window.clearTimeout(t);
    }
  }

  async function changeQty(item: Item, quantity: number) {
    const prev = item.quantity;
    setItems((p) => p.map((i) => (i.id === item.id ? { ...i, quantity } : i))); // otimista
    try {
      const res = await putQuantity(item.id, quantity);
      if (!res.ok) throw new Error();
    } catch {
      setItems((p) => p.map((i) => (i.id === item.id ? { ...i, quantity: prev } : i))); // reverte
      toast("Não foi possível atualizar a quantidade.");
    }
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
              checked={it.isPurchased}
              onToggle={() => toggle(it)}
              onRemove={() => remove(it)}
              onQuantityChange={(q) => changeQty(it, q)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
