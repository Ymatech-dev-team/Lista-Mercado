import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/icons";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:bg-disabled-bg disabled:text-disabled-fg",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:opacity-90",
        secondary: "border border-hairline bg-surface text-ink hover:bg-surface-sunken",
        ghost: "text-muted hover:bg-surface-sunken",
        destructive: "bg-danger text-on-danger hover:opacity-90",
        "destructive-ghost": "text-danger hover:bg-danger-bg",
      },
      size: {
        md: "h-11 px-5",
        sm: "h-9 px-4",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { loading?: boolean };

export function Button({ className, variant, size, loading, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export { buttonVariants };
