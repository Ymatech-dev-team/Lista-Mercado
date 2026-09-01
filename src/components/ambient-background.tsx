import type { CSSProperties } from "react";

// Fundo ambiente decorativo: hortifrúti subindo devagar. Puro CSS (só transform/opacity),
// posições FIXAS (nada de Math.random → sem hydration mismatch), atrás do conteúdo e
// invisível ao leitor de tela. Congela via prefers-reduced-motion (ver globals.css).

const Leaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 7c3-4 8-3 8 1 0 5-5 9-8 11-3-2-8-6-8-11 0-4 5-5 8-1z" />
    <path d="M12 7V3" />
  </svg>
);
const Bag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h13l-1.2 8H5.2z" />
    <path d="M4 8 3 5H1" />
    <circle cx="8" cy="20" r="1.3" />
    <circle cx="15" cy="20" r="1.3" />
  </svg>
);
const Grapes = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4c2 0 4 1 6 4M12 8c2-3 4-4 6-4" />
    <path d="M6 8c-3 2-3 8 0 11 2 2 4 1 6 0 2 1 4 2 6 0 3-3 3-9 0-11-2-1-4 0-6 1-2-1-4-2-6-1z" />
  </svg>
);

const ICONS = [Leaf, Bag, Grapes];

type Item = { left: string; size: number; dur: number; delay: number; r0: number; r1: number; icon: number; onMobile?: boolean };

// Valores escolhidos à mão (não aleatórios): variados, mas estáveis entre servidor e cliente.
const ITEMS: Item[] = [
  { left: "6%", size: 34, dur: 26, delay: -3, r0: -12, r1: 20, icon: 0, onMobile: true },
  { left: "20%", size: 46, dur: 33, delay: -14, r0: 8, r1: -18, icon: 1 },
  { left: "34%", size: 28, dur: 22, delay: -9, r0: -6, r1: 24, icon: 2, onMobile: true },
  { left: "50%", size: 40, dur: 30, delay: -20, r0: 14, r1: -10, icon: 0 },
  { left: "64%", size: 30, dur: 24, delay: -6, r0: -18, r1: 12, icon: 2, onMobile: true },
  { left: "78%", size: 48, dur: 35, delay: -17, r0: 10, r1: -22, icon: 1 },
  { left: "90%", size: 32, dur: 28, delay: -11, r0: -8, r1: 16, icon: 0, onMobile: true },
];

export function AmbientBackground() {
  return (
    <div aria-hidden className="ambient pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {ITEMS.map((it, i) => {
        const Icon = ICONS[it.icon];
        const style = {
          left: it.left,
          width: it.size,
          height: it.size,
          "--dur": `${it.dur}s`,
          "--delay": `${it.delay}s`,
          "--r0": `${it.r0}deg`,
          "--r1": `${it.r1}deg`,
        } as CSSProperties;
        return (
          <span key={i} className={it.onMobile ? "ambient-item" : "ambient-item hidden sm:block"} style={style}>
            <Icon />
          </span>
        );
      })}
    </div>
  );
}
