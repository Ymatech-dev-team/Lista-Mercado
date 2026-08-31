import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { AppShell } from "@/components/app-shell";

export const runtime = "nodejs";

// Protege TODAS as telas do app (redireciona pro login se deslogado) e monta a moldura responsiva.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <AppShell userEmail={user.email}>{children}</AppShell>;
}
