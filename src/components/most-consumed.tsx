"use client";

import { toast } from "sonner";
import { quickAddAction } from "@/app/(app)/lista/actions";
import { Plus } from "@/components/icons";

export type ConsumedItem = { productId: string; name: string; vezes: number };

export function MostConsumed({ items }: { items: ConsumedItem[] }) {
  async function add(it: ConsumedItem) {
    const res = await quickAddAction(it.productId);
    toast(res?.error ?? `${it.name} adicionado à lista`);
  }

  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.productId}>
          <button
            type="button"
            onClick={() => add(it)}
            aria-label={`Adicionar ${it.name} à lista`}
            className="flex w-full items-center gap-3 rounded-xl border border-hairline bg-surface p-3 text-left transition-colors hover:bg-surface-sunken active:scale-[0.99]"
          >
            <span className="flex-1 text-sm font-medium text-ink">{it.name}</span>
            <span className="font-[family-name:var(--font-num)] text-[11px] text-muted">{it.vezes}×</span>
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-selection text-primary-strong">
              <Plus className="h-4 w-4" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
