import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sem conexão — Meu Mercado" };

// Fallback de navegação offline (servido pelo service worker no cold-start sem rede). Público/estático.
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">sem conexão</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-[22px] font-semibold text-ink">Você está offline</h1>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
        Sua lista precisa de internet pra carregar os dados atualizados. O que você marcou reenvia sozinho ao voltar.
      </p>
      {/* <a> puro (não next/link): força carregamento de documento → passa pelo SW network-first e
          reavalia a rede na hora (Link seria soft-nav e ficaria pendente offline). */}
      <a href="/inicio" className={cn(buttonVariants(), "mt-5")}>
        Tentar de novo
      </a>
    </div>
  );
}
