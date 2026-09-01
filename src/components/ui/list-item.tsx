import { cn } from "@/lib/utils";
import { Check, Trash, Plus, Minus } from "@/components/icons";
import { formatBRL } from "@/lib/money";
import { PriceField } from "@/app/(app)/lista/price-field";

type ListItemProps = {
  name: string;
  quantity?: number;
  unitPriceCents?: number | null;
  checked?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  onQuantityChange?: (q: number) => void;
  onPriceChange?: (cents: number | null) => void;
  className?: string;
};

// Componente-assinatura: a linha da lista. Concluído = cor apagada + tique (forma), SEM riscado
// (design.md §9.6). Com onQuantityChange → layout Opção B (2 linhas: nome+subtotal em cima,
// stepper + preço embaixo). Sem ele → linha única simples (galeria/leitura).
export function ListItem({
  name,
  quantity,
  unitPriceCents,
  checked = false,
  onToggle,
  onRemove,
  onQuantityChange,
  onPriceChange,
  className,
}: ListItemProps) {
  const qty = quantity ?? 1;
  const hasPrice = unitPriceCents != null;
  const subtotal = hasPrice ? formatBRL(unitPriceCents! * qty) : "—";

  const CheckMark = (
    <span
      className={cn(
        "flex h-6 w-6 flex-none items-center justify-center rounded-md border transition-colors",
        checked ? "border-accent-fill bg-accent-fill text-on-primary" : "border-border-field text-transparent"
      )}
    >
      <Check className="h-3.5 w-3.5" />
    </span>
  );

  const RemoveBtn = onRemove && (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remover ${name}`}
      className="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger active:scale-[0.98]"
    >
      <Trash className="h-4 w-4" />
    </button>
  );

  // ----- Opção B: linha do item editável (com preço) -----
  if (onQuantityChange) {
    return (
      <div className={cn("border-b border-hairline py-1.5 last:border-b-0", className)}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={checked}
            className="-mx-1 flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left transition-colors active:bg-surface-sunken"
          >
            {CheckMark}
            <span className={cn("min-w-0 flex-1 truncate text-sm", checked ? "text-done" : "text-ink")}>{name}</span>
          </button>
          <span
            className={cn(
              "font-[family-name:var(--font-num)] tabular-nums text-sm",
              hasPrice ? "font-medium text-ink" : "text-muted"
            )}
          >
            {subtotal}
          </span>
          {RemoveBtn}
        </div>

        <div className="flex items-center gap-2 pl-9 pt-0.5">
          <div className="flex flex-none items-center rounded-lg border border-hairline">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, qty - 1))}
              disabled={qty <= 1}
              aria-label={`Diminuir ${name}`}
              className="flex h-11 w-9 items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[22px] text-center font-[family-name:var(--font-num)] tabular-nums text-sm text-ink">{qty}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(qty + 1)}
              aria-label={`Aumentar ${name}`}
              className="flex h-11 w-9 items-center justify-center text-muted transition-colors hover:text-ink"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-xs text-muted">×</span>
          {onPriceChange && <PriceField name={name} valueCents={unitPriceCents ?? null} onCommit={onPriceChange} />}
        </div>
      </div>
    );
  }

  // ----- Linha única simples (galeria / leitura) -----
  return (
    <div className={cn("flex items-center gap-1 border-b border-hairline last:border-b-0", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className="-mx-1 flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left transition-colors active:bg-surface-sunken"
      >
        {CheckMark}
        <span className={cn("min-w-0 flex-1 truncate text-sm", checked ? "text-done" : "text-ink")}>{name}</span>
      </button>
      {hasPrice ? (
        <span className="font-[family-name:var(--font-num)] tabular-nums text-sm text-num">{subtotal}</span>
      ) : quantity && quantity > 1 ? (
        <span className="font-[family-name:var(--font-num)] tabular-nums text-xs text-num">{quantity}</span>
      ) : null}
      {RemoveBtn}
    </div>
  );
}
