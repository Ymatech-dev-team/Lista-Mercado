import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { EntrarForm } from "./entrar-form";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Entrar — Meu Mercado" };

export default async function EntrarPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <Card className="p-6">
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-[22px] font-semibold text-ink">Entrar</h1>
      <p className="mb-6 text-sm text-muted">Bem-vindo de volta.</p>
      <EntrarForm />
    </Card>
  );
}
