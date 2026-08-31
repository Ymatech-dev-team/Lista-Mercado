import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "@/components/icons";

type InputProps = ComponentProps<"input"> & { invalid?: boolean; error?: string };

// text-base (16px) evita o zoom automático do iOS. Estado de erro comunica por
// borda + ícone + mensagem (não só cor) e liga aria-describedby internamente (design.md §9.5/§9.6).
export function Input({ className, invalid, error, id, "aria-describedby": describedBy, ...props }: InputProps) {
  const isInvalid = invalid || !!error;
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className="w-full">
      <div className="relative">
        <input
          id={id}
          aria-invalid={isInvalid || undefined}
          aria-describedby={errorId ?? describedBy}
          className={cn(
            "h-11 w-full rounded-lg border border-border-field bg-surface px-3 text-base text-ink transition-colors",
            "placeholder:text-muted focus-visible:border-primary",
            "disabled:bg-disabled-bg disabled:text-disabled-fg",
            isInvalid && "border-danger-border pr-10 focus-visible:border-danger-border",
            className
          )}
          {...props}
        />
        {isInvalid && (
          <AlertTriangle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-danger" />
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
