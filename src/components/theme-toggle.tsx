"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  // Até montar, o servidor não sabe o tema — usa rótulo neutro nos DOIS lados (evita hydration mismatch).
  const label = !mounted ? "Alternar tema" : isDark ? "Mudar para tema claro" : "Mudar para tema escuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-hairline bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken active:scale-[0.98]"
    >
      <span aria-hidden className="text-num font-[family-name:var(--font-num)] text-xs uppercase tracking-wider">
        tema
      </span>
      <span className="min-w-[3.5rem] text-left">{mounted ? (isDark ? "escuro" : "claro") : "—"}</span>
    </button>
  );
}
