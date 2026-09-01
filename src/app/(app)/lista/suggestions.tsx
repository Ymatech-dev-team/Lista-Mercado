"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addSuggestionAction } from "./actions";
import { Plus } from "@/components/icons";

export type Suggestion = { name: string; reason: string };

export function Suggestions({ items }: { items: Suggestion[] }) {
  const [adding, setAdding] = useState<string | null>(null);
  if (items.length === 0) return null;

  async function add(s: Suggestion) {
    if (adding) return;
    setAdding(s.name);
    try {
      const res = await addSuggestionAction(s.name);
      toast(res?.error ?? `${s.name} adicionado à lista`);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="mt-6 border-t border-dashed border-hairline pt-5">
      <p className="mb-3 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.08em] text-muted">que tal também?</p>
      <div className="flex flex-wrap gap-2">
        {items.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => add(s)}
            disabled={adding === s.name}
            aria-label={`Adicionar ${s.name}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-border-field pl-3 pr-2 text-sm text-ink transition-colors hover:bg-surface-sunken disabled:opacity-60"
          >
            {s.name}
            <span className="text-[11px] text-muted">{s.reason}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-selection text-primary-strong">
              <Plus className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
