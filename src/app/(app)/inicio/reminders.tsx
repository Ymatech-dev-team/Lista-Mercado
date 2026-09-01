"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { quickAddAction } from "@/app/(app)/lista/actions";
import { Plus, X } from "@/components/icons";
import type { Reminder } from "@/lib/reminders";

const DISMISS_KEY = "mm:reminder-dismissed"; // { [productId]: lastCompletedAt } — dispensa até a próxima compra

function readDismissed(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || "{}");
  } catch {
    return {};
  }
}

const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

export function RepurchaseReminders({ reminders }: { reminders: Reminder[] }) {
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);

  // Só renderiza após hidratar (lê o localStorage) — evita o flash de itens já dispensados.
  useEffect(() => {
    setHidden(readDismissed());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const visible = reminders.filter((r) => hidden[r.productId] !== r.lastCompletedAt && !added.has(r.productId));
  if (visible.length === 0) return null;

  function dismiss(r: Reminder) {
    const next = { ...readDismissed(), [r.productId]: r.lastCompletedAt };
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* localStorage indisponível */
    }
    setHidden(next);
    toast(`Ok — aviso de novo quando você repor ${r.name}.`);
  }

  async function add(r: Reminder) {
    if (adding) return;
    setAdding(r.productId);
    try {
      const res = await quickAddAction(r.productId);
      if (res?.error) {
        toast(res.error);
      } else {
        setAdded((prev) => new Set(prev).add(r.productId)); // some da vista na hora (otimista)
        toast(`${r.name} adicionado à lista`);
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <section className="mt-9">
      <p className="mb-3 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">hora de repor?</p>
      <ul className="rounded-2xl border border-hairline bg-surface">
        {visible.map((r) => (
          <li key={r.productId} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-ink">{r.name}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                faz {dias(r.daysSince)} · você costuma comprar a cada {dias(r.avgIntervalDays)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => add(r)}
              disabled={adding === r.productId}
              aria-label={`Adicionar ${r.name} à lista`}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-accent-fill bg-selection text-primary-strong transition-colors hover:bg-surface-sunken disabled:opacity-60"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => dismiss(r)}
              aria-label={`Dispensar ${r.name} até a próxima compra`}
              className="flex h-10 w-9 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
