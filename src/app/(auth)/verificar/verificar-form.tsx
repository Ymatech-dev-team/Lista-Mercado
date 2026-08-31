"use client";

import { useActionState } from "react";
import Link from "next/link";
import { verifyEmailAction, type VerifyState } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initial: VerifyState = {};

export function VerificarForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmailAction, initial);

  if (state.ok) {
    return (
      <div>
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-[20px] font-semibold text-ink">E-mail confirmado</h1>
        <p className="mb-6 text-sm text-muted">Sua conta está ativa. Agora é só entrar.</p>
        <Link href="/entrar" className={cn(buttonVariants(), "w-full")}>Entrar</Link>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-[20px] font-semibold text-ink">Confirmar seu e-mail</h1>
      <p className="mb-6 text-sm text-muted">Clique abaixo para ativar sua conta.</p>
      {state.error && <p className="mb-4 text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-full">Confirmar meu e-mail</Button>
    </form>
  );
}
