"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "@/components/icons";

const DISMISS_KEY = "mm:install-dismissed";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

// Evento não-padrão (Chromium): guarda a interface mínima que usamos.
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

// Captura em NÍVEL DE MÓDULO (roda quando o chunk carrega, antes do React montar): o
// beforeinstallprompt costuma disparar cedo e seria perdido se só ouvíssemos no useEffect.
// Guarda o evento e avisa componentes montados via evento custom "mm:bip".
let capturedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    capturedPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("mm:bip"));
  });
}

// Convite de instalação (design.md RF1-RF5): botão nativo no Android, instrução no iOS, oculto
// quando já instalado (standalone), sem suporte, ou dispensado (30 dias).
export function InstallInvite() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return; // já instalado (RF3)

    try {
      const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (ts && Date.now() - ts < DISMISS_MS) return; // dispensado recentemente (RF4)
    } catch {
      /* localStorage indisponível */
    }

    const ios = /ipad|iphone|ipod/i.test(window.navigator.userAgent) && !("MSStream" in window);
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return; // iOS não dispara beforeinstallprompt (RF2)
    }

    // Android/Chrome: consome o evento já capturado (ou espera o custom "mm:bip"). Sem evento = oculto (RF5).
    const consume = () => {
      if (capturedPrompt) {
        setDeferred(capturedPrompt);
        setShow(true);
      }
    };
    consume();
    window.addEventListener("mm:bip", consume);
    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("mm:bip", consume);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    capturedPrompt = null;
    setShow(false);
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-hairline bg-surface p-3">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink">Instale o Meu Mercado</p>
        <p className="mt-0.5 text-[12px] text-muted">
          {isIOS
            ? 'Toque em Compartilhar e depois "Adicionar à Tela de Início".'
            : "Na tela inicial, abre em tela cheia como um app."}
        </p>
      </div>
      {!isIOS && (
        <Button size="sm" variant="secondary" onClick={install}>
          Instalar
        </Button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Agora não"
        className="flex h-10 w-9 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
