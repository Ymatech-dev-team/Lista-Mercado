"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check } from "@/components/icons";

type CheckboxProps = ComponentProps<"input"> & { label?: ReactNode };

// Checkbox de formulário (ex.: consentimento LGPD). Input nativo (acessível) + caixa estilizada.
export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <label
      htmlFor={inputId}
      className={cn("inline-flex min-h-11 cursor-pointer select-none items-start gap-3 py-1.5", className)}
    >
      <input id={inputId} type="checkbox" className="peer sr-only" {...props} />
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border border-border-field text-on-primary transition-colors",
          "peer-checked:border-accent-fill peer-checked:bg-accent-fill",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus-ring)]",
          "[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}
