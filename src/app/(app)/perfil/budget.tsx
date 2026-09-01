"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import { setBudgetAction } from "./actions";

// Editor do teto de gasto mensal (RF26). Vazio ao salvar = remover teto.
export function BudgetSetting({ initialCents }: { initialCents: number | null }) {
  const [cents, setCents] = useState<number | null>(initialCents);
  const [editing, setEditing] = useState(false);
  const [buf, setBuf] = useState(initialCents != null ? (initialCents / 100).toFixed(2).replace(".", ",") : "");
  const [busy, setBusy] = useState(false);

  async function save() {
    const trimmed = buf.trim();
    const next = trimmed === "" ? null : parseBRLToCents(trimmed);
    if (trimmed !== "" && (next == null || next < 1)) {
      toast.error("Informe um valor válido (de R$ 0,01 a R$ 99.999,99).");
      return;
    }
    setBusy(true);
    const res = await setBudgetAction(next);
    setBusy(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    setCents(next);
    setEditing(false);
    toast(next == null ? "Teto removido" : "Teto salvo");
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface p-4">
        <div className="min-w-0">
          <p className="text-[15px] text-ink">
            {cents != null ? (
              <>
                <span className="font-[family-name:var(--font-num)] tabular-nums">{formatBRL(cents)}</span> por mês
              </>
            ) : (
              "Sem teto definido"
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted">Um aviso quando o gasto do mês se aproxima do limite. Acompanhe na Início.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setBuf(cents != null ? (cents / 100).toFixed(2).replace(".", ",") : "");
            setEditing(true);
          }}
        >
          {cents != null ? "Editar" : "Definir"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <label htmlFor="budget" className="text-sm text-muted">
        Teto mensal (deixe vazio para remover)
      </label>
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex h-11 flex-1 items-center gap-1 rounded-lg border border-border-field px-3 focus-within:border-primary">
          <span className="font-[family-name:var(--font-num)] text-xs text-muted">R$</span>
          <input
            id="budget"
            type="text"
            inputMode="decimal"
            value={buf}
            disabled={busy}
            onChange={(e) => setBuf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy) void save();
            }}
            placeholder="0,00"
            className="w-full bg-transparent font-[family-name:var(--font-num)] text-sm text-ink outline-none placeholder:text-muted disabled:opacity-60"
          />
        </span>
        <Button size="sm" loading={busy} onClick={save}>
          Salvar
        </Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
