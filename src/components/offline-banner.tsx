"use client";

import { useOffline } from "next/offline";
import { AlertTriangle } from "@/components/icons";

// Banner de conexão (design.md RF8). useOffline() vem do experimental.useOffline: fica true quando
// uma requisição falha por rede OU no evento offline; volta a false quando a conexão retorna.
// Retorna false no SSR/hidratação → não há mismatch (renderiza null nos dois lados no início).
export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-2 bg-warning-bg px-4 py-2 text-center text-[13px] text-warning"
    >
      <AlertTriangle className="h-4 w-4 flex-none" aria-hidden />
      Sem conexão — o que você fizer reenvia ao voltar.
    </div>
  );
}
