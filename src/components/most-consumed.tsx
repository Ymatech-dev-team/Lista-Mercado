"use client";

import { useState } from "react";
import { toast } from "sonner";
import { quickAddAction } from "@/app/(app)/lista/actions";
import { Plus, Spinner } from "@/components/icons";

export type ConsumedItem = { productId: string; name: string; vezes: number };

export function MostConsumed({ items }: { items: ConsumedItem[] }) {
  const [addingId, setAddingId] = useState<string | null>(null);

  async function add(it: ConsumedItem) {
    if (addingId) return; // trava duplo-clique / cliques concorrentes
    setAddingId(it.productId);
    try {
      const res = await quickAddAction(it.productId);
      toast(res?.error ?? `${it.name} adicionado à lista`);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const adding = addingId === it.productId;
        return (
          <li key={it.productId}>
            <button
              type="button"
              onClick={() => add(it)}
              disabled={adding}
              aria-label={`Adicionar ${it.name} à lista`}
              className="flex w-full items-center gap-3 rounded-xl border border-hairline bg-surface p-3 text-left transition-colors hover:bg-surface-sunken active:scale-[0.99] disabled:opacity-70"
            >
              <span className="flex-1 text-sm font-medium text-ink">{it.name}</span>
              <span className="font-[family-name:var(--font-num)] text-[11px] text-muted">{it.vezes}×</span>
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-selection text-primary-strong">
                {adding ? <Spinner className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
