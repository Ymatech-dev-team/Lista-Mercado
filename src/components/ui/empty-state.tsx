import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-10 text-center",
        className
      )}
    >
      {icon && <div className="mb-3 text-muted [&>svg]:h-8 [&>svg]:w-8">{icon}</div>}
      <p className="font-[family-name:var(--font-display)] text-[17px] font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
