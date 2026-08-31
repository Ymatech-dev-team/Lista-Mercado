import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { MailIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Confirme seu e-mail — Meu Mercado" };

export default function VerifiqueEmailPage() {
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-selection text-primary-strong">
        <MailIcon className="h-6 w-6" />
      </div>
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-[20px] font-semibold text-ink">Confirme seu e-mail</h1>
      <p className="text-sm text-muted">
        Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar sua conta.
      </p>
      <p className="mt-3 text-sm text-muted">Não recebeu? Verifique a caixa de spam.</p>
    </Card>
  );
}
