"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestResetAction, type RequestResetState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initial: RequestResetState = {};

export function EsqueciForm() {
  const [state, action, pending] = useActionState(requestResetAction, initial);

  if (state.sent) {
    return (
      <div className="text-center">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-[20px] font-semibold text-ink">Verifique seu e-mail</h1>
        <p className="mb-6 text-sm text-muted">
          Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.
        </p>
        <Link href="/entrar" className="text-sm text-primary">Voltar para entrar</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-[22px] font-semibold text-ink">Esqueci a senha</h1>
      <p className="text-sm text-muted">Digite seu e-mail e enviaremos um link para criar uma nova senha.</p>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="voce@email.com" required />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-full">Enviar link</Button>
      <p className="text-center text-sm text-muted">
        Lembrou? <Link href="/entrar" className="text-primary">Entrar</Link>
      </p>
    </form>
  );
}
