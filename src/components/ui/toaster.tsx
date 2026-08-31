"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

// Toasts do app (sonner), tematizados com nossos tokens. Suporta ação "Desfazer".
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      toastOptions={{
        style: {
          background: "var(--surface)",
          color: "var(--ink)",
          border: "1px solid var(--hairline)",
          borderRadius: "12px",
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
        },
      }}
    />
  );
}
