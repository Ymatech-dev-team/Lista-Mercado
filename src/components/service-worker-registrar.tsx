"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// Registra o SW e avisa quando há nova versão (design.md RF12). Nunca troca o SW em silêncio: só
// quando o usuário toca "Atualizar" (postMessage skip-waiting → controllerchange → reload).
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    function promptUpdate(worker: ServiceWorker) {
      toast("Nova versão disponível", {
        action: { label: "Atualizar", onClick: () => worker.postMessage("skip-waiting") },
        cancel: { label: "Depois", onClick: () => {} },
        duration: Infinity,
      });
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            // "installed" + já há controller = é uma ATUALIZAÇÃO (não a 1ª instalação)
            if (nw.state === "installed" && navigator.serviceWorker.controller) promptUpdate(nw);
          });
        });
      })
      .catch(() => {
        /* SW indisponível (sem suporte / http) — app segue normal */
      });
  }, []);

  return null;
}
