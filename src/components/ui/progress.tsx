import { cn } from "@/lib/utils";

type ProgressProps = { value: number; className?: string; label?: string };

export function Progress({ value, className, label = "Progresso da lista" }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 overflow-hidden rounded-full bg-surface-sunken", className)}
    >
      <div className="h-full rounded-full bg-accent-fill transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
