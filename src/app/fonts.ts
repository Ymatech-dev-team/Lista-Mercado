// Fontes do design-system "Mercadinho" (design.md §9.4), auto-hospedadas via next/font.
import { Familjen_Grotesk, Hanken_Grotesk, DM_Mono } from "next/font/google";

// Títulos — Familjen Grotesk (variável)
export const fontDisplay = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-familjen",
  display: "swap",
});

// Corpo — Hanken Grotesk (variável)
export const fontBody = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

// Números/labels de recibo — DM Mono (pesos fixos)
export const fontNum = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dmmono",
  display: "swap",
});
