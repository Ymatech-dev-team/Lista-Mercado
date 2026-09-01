"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "@/components/icons";
import { cn } from "@/lib/utils";

// Botão de tema no formato de item de navegação. `collapsed` → só o ícone (sidebar recolhida).
// Até montar, servidor e cliente renderizam o MESMO conteúdo neutro (evita hydration mismatch).
export function ThemeToggle({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = !mounted ? "Alternar tema" : isDark ? "Mudar para tema claro" : "Mudar para tema escuro";
  const text = !mounted ? "Tema" : isDark ? "Tema claro" : "Tema escuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={cn(
        "flex h-10 items-center rounded-lg text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink",
        collapsed ? "w-full justify-center px-0" : "gap-3 px-3",
        className
      )}
    >
      <span className="flex h-5 w-5 flex-none items-center justify-center" aria-hidden>
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </span>
      {!collapsed && <span>{text}</span>}
    </button>
  );
}
