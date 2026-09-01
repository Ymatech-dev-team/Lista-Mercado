import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "@/components/icons";

function CartLogo({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-1.5 9h-12z" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M6 6 5 3H3" />
    </svg>
  );
}

const benefits = [
  "Marque os itens conforme pega no corredor",
  "Veja na Home o que você mais compra",
  "Funciona no computador e no celular",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      {/* Painel da marca — desktop (superfície fixa verde-ink, funciona nos 2 temas) */}
      <aside className="hidden flex-col justify-between bg-[#12352a] p-12 text-[#eaf3ea] lg:flex lg:w-[45%]">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#33bd78] text-[#0f2a1e]">
            <CartLogo />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[18px] font-semibold">Meu Mercado</span>
        </Link>

        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-balance">
            Sua lista de compras, do jeito que você compra.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-[#cfe0d5]">
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-[#33bd78]/20 text-[#7fe0aa]">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-[#7fa08d]">Feito pra usar no corredor do mercado.</p>
      </aside>

      {/* Formulário */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent-fill text-on-primary">
            <CartLogo />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-ink">Meu Mercado</span>
        </Link>
        {/* sombra sutil no card do formulário (aparece no claro; some no escuro) */}
        <div className="w-full max-w-sm [&>*]:shadow-[0_12px_32px_-16px_rgba(20,40,30,0.18)]">{children}</div>
      </main>
    </div>
  );
}
