"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initial: LoginState = {};

export function EntrarForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="voce@email.com" required />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink">Senha</label>
          <Link href="/esqueci-senha" className="text-sm text-primary">Esqueci a senha</Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" loading={pending} className="w-full">Entrar</Button>

      <p className="text-center text-sm text-muted">
        Não tem conta? <Link href="/cadastro" className="text-primary">Criar conta</Link>
      </p>
    </form>
  );
}
