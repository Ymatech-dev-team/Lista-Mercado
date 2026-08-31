"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type SignupState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const initial: SignupState = {};

export function CadastroForm() {
  const [state, action, pending] = useActionState(signupAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          error={state.fieldErrors?.email}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">Senha</label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={state.fieldErrors?.password}
          required
        />
      </div>

      <div>
        <Checkbox
          name="consent"
          label={
            <>
              Li e aceito a{" "}
              <Link href="/privacidade" className="text-primary underline">política de privacidade</Link>
            </>
          }
        />
        {state.fieldErrors?.consent && <p className="mt-1.5 text-sm text-danger">{state.fieldErrors.consent}</p>}
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" loading={pending} className="w-full">Criar conta</Button>

      <p className="text-center text-sm text-muted">
        Já tem conta? <Link href="/entrar" className="text-primary">Entrar</Link>
      </p>
    </form>
  );
}
