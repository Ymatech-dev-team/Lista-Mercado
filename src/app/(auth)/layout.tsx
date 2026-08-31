import Link from "next/link";
import type { ReactNode } from "react";

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

const preview: [string, boolean][] = [
  ["Arroz", true],
  ["Café", true],
  ["Banana", false],
  ["Leite", false],
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

          <div className="mt-8 max-w-xs rounded-2xl bg-white/10 p-5">
            <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-[#a9c4b5]">lista ativa</p>
            <p className="mt-0.5 font-[family-name:var(--font-display)] text-[17px] font-medium">Compras da semana</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {preview.map(([nome, done]) => (
                <li key={nome} className="flex items-center gap-3">
                  <span
                    className={
                      done
                        ? "flex h-4 w-4 items-center justify-center rounded-[5px] bg-[#33bd78] text-[#0f2a1e]"
                        : "h-4 w-4 rounded-[5px] border border-white/30"
                    }
                  >
                    {done && (
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={done ? "text-[#a9c4b5]" : ""}>{nome}</span>
                </li>
              ))}
            </ul>
          </div>
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
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
