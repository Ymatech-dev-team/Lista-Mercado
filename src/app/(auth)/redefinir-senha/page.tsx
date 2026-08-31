import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { RedefinirForm } from "./redefinir-form";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Redefinir senha — Meu Mercado", referrer: "no-referrer" };

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <Card className="p-6">
      {token ? (
        <RedefinirForm token={token} />
      ) : (
        <p className="text-center text-sm text-danger">Link inválido ou incompleto.</p>
      )}
    </Card>
  );
}
