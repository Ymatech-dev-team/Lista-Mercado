import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; icon: ReactNode; href?: string; active?: boolean };

export function BottomNav({ items, className }: { items: NavItem[]; className?: string }) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn("flex items-stretch justify-around border-t border-hairline bg-surface", className)}
    >
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href ?? "#"}
          aria-current={it.active ? "page" : undefined}
          className={cn(
            "flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
            it.active ? "text-primary" : "text-muted hover:text-ink"
          )}
        >
          <span className="[&>svg]:h-[22px] [&>svg]:w-[22px]">{it.icon}</span>
          {it.label}
        </a>
      ))}
    </nav>
  );
}
