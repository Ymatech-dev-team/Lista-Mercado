import type { Metadata } from "next";
import { fontDisplay, fontBody, fontNum } from "./fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { OfflineBanner } from "@/components/offline-banner";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meu Mercado",
  description: "Sua lista de compras, do jeito que você compra.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontNum.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <OfflineBanner />
          <ServiceWorkerRegistrar />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
