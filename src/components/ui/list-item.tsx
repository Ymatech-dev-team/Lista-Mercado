import { cn } from "@/lib/utils";
import { Check, Trash, Plus, Minus } from "@/components/icons";

type ListItemProps = {
  name: string;
  quantity?: number;
  checked?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  onQuantityChange?: (q: number) => void;
  className?: string;
};

// Componente-assinatura: a linha da lista. Área nome/toque marca (≥48px). Concluído = cor
// apagada + tique (forma), SEM riscado (design.md §9.6). Com onQuantityChange, mostra stepper +/−.
export function ListItem({
  name,
  quantity,
  checked = false,
  onToggle,
  onRemove,
  onQuantityChange,
  className,
}: ListItemProps) {
  const qty = quantity ?? 1;
  return (
    <div className={cn("flex items-center gap-1 border-b border-hairline last:border-b-0", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className="-mx-1 flex min-h-12 flex-1 items-center gap-3 rounded-lg px-1 text-left transition-colors active:bg-surface-sunken"
      >
        <span
          className={cn(
            "flex h-6 w-6 flex-none items-center justify-center rounded-md border transition-colors",
            checked ? "border-accent-fill bg-accent-fill text-on-primary" : "border-border-field text-transparent"
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className={cn("flex-1 text-sm", checked ? "text-done" : "text-ink")}>{name}</span>
      </button>

      {onQuantityChange ? (
        <div className="flex flex-none items-center rounded-lg border border-hairline">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            aria-label={`Diminuir ${name}`}
            className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[26px] text-center font-[family-name:var(--font-num)] tabular-nums text-sm text-ink">{qty}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(qty + 1)}
            aria-label={`Aumentar ${name}`}
            className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-ink"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : quantity && quantity > 1 ? (
        <span className="font-[family-name:var(--font-num)] tabular-nums text-xs text-num">{quantity}</span>
      ) : null}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${name}`}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger active:scale-[0.98]"
        >
          <Trash className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
