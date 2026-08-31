import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EsqueciForm } from "./esqueci-form";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Esqueci a senha — Meu Mercado" };

export default function EsqueciSenhaPage() {
  return (
    <Card className="p-6">
      <EsqueciForm />
    </Card>
  );
}
