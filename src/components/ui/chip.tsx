import { cn } from "@/lib/utils";
import { Plus } from "@/components/icons";

type ChipProps = {
  label: string;
  meta?: string; // ex.: "12×"
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
};

// Sem onAdd: etiqueta estática. Com onAdd: o chip inteiro é o botão (alvo de toque ≥44px).
export function Chip({ label, meta, onAdd, addLabel, className }: ChipProps) {
  if (onAdd) {
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel ?? `Adicionar ${label}`}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-lg border border-hairline bg-surface pl-3 pr-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken active:scale-[0.98]",
          className
        )}
      >
        {label}
        {meta && <span className="font-[family-name:var(--font-num)] text-[11px] text-muted">{meta}</span>}
        <Plus className="h-4 w-4 text-muted" />
      </button>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface px-3 text-sm text-ink",
        className
      )}
    >
      {label}
      {meta && <span className="font-[family-name:var(--font-num)] text-[11px] text-muted">{meta}</span>}
    </span>
  );
}
