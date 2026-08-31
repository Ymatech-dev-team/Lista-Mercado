import { cn } from "@/lib/utils";
import { Check, Trash } from "@/components/icons";

type ListItemProps = {
  name: string;
  quantity?: string;
  checked?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  className?: string;
};

// Componente-assinatura: a linha da lista. A área toque/nome/quantidade inteira marca (≥48px),
// com feedback tátil (active). Concluído = cor apagada + tique (forma), SEM riscado (design.md §9.6).
export function ListItem({ name, quantity, checked = false, onToggle, onRemove, className }: ListItemProps) {
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
        {quantity && (
          <span className="font-[family-name:var(--font-num)] tabular-nums text-sm text-num">{quantity}</span>
        )}
      </button>
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
