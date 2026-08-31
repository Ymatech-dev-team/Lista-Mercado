"use client";

import type { ReactNode } from "react";
import { logoutAction } from "@/app/auth-actions";

// Limpa o estado local do dispositivo antes de sair (celular de família — RF1/design.md §RNF).
function clearDeviceState() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("mm:"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* localStorage indisponível */
  }
}

export function LogoutButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <form action={logoutAction}>
      <button type="submit" onClick={clearDeviceState} className={className}>
        {children}
      </button>
    </form>
  );
}
