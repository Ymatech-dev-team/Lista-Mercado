import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { CadastroForm } from "./cadastro-form";

// Endpoint que faz hash de senha DEVE rodar no runtime Node (design.md §4).
export const runtime = "nodejs";

export const metadata: Metadata = { title: "Criar conta — Meu Mercado" };

export default function CadastroPage() {
  return (
    <Card className="p-6">
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-[22px] font-semibold text-ink">Criar conta</h1>
      <p className="mb-6 text-sm text-muted">Suas listas ficam salvas e só suas.</p>
      <CadastroForm />
    </Card>
  );
}
