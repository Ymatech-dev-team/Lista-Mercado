"use client";

import { useEffect, useRef, useState } from "react";
import { parseBRLToCents } from "@/lib/money";
import { cn } from "@/lib/utils";

// Centavos → texto editável "12,90" (sem símbolo; o "R$" fica fora do input).
function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

// Campo de preço por item. Buffer local permite digitação parcial ("12,"); commit no blur/Enter.
// Preço inválido reverte para o último válido (design.md RF4). Vazio limpa o preço (null).
// O preço lembrado é aplicado no servidor ao adicionar (D2 — opção B), então aqui o campo edita
// sempre um valor real; a etiqueta "lembrado" fica no ListItem.
export function PriceField({
  name,
  valueCents,
  disabled,
  onCommit,
}: {
  name: string;
  valueCents: number | null;
  disabled?: boolean;
  onCommit: (cents: number | null) => void;
}) {
  const [buf, setBuf] = useState(valueCents != null ? centsToInput(valueCents) : "");
  const focused = useRef(false);

  // Ressincroniza quando o valor externo muda (reconcile, desfazer) — mas NUNCA enquanto o usuário
  // está digitando, senão uma mudança externa apagaria a edição em curso.
  useEffect(() => {
    if (focused.current) return;
    setBuf(valueCents != null ? centsToInput(valueCents) : "");
  }, [valueCents]);

  function commit() {
    focused.current = false;
    const trimmed = buf.trim();
    if (trimmed === "") {
      if (valueCents != null) onCommit(null); // limpou o preço
      return;
    }
    const cents = parseBRLToCents(trimmed);
    if (cents == null) {
      setBuf(valueCents != null ? centsToInput(valueCents) : ""); // reverte (RF4)
      return;
    }
    if (cents !== valueCents) onCommit(cents);
    setBuf(centsToInput(cents));
  }

  const empty = valueCents == null;
  return (
    <span
      className={cn(
        "inline-flex h-11 items-center gap-1 rounded-lg border px-2 transition-colors focus-within:border-primary",
        empty ? "border-dashed border-border-field" : "border-hairline"
      )}
    >
      <span className="font-[family-name:var(--font-num)] text-[11px] text-muted">R$</span>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={buf}
        onChange={(e) => setBuf(e.target.value)}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="0,00"
        aria-label={`Preço de ${name}`}
        className="w-14 bg-transparent font-[family-name:var(--font-num)] text-sm text-ink outline-none placeholder:text-muted"
      />
    </span>
  );
}
