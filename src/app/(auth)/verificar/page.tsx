import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { VerificarForm } from "./verificar-form";

export const runtime = "nodejs";
// no-referrer: o token vai na URL; evita vazá-lo pelo header Referer (design.md §4 · M1).
export const metadata: Metadata = { title: "Confirmar e-mail — Meu Mercado", referrer: "no-referrer" };

export default async function VerificarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <Card className="p-6 text-center">
      {token ? (
        <VerificarForm token={token} />
      ) : (
        <p className="text-sm text-danger">Link inválido ou incompleto.</p>
      )}
    </Card>
  );
}
