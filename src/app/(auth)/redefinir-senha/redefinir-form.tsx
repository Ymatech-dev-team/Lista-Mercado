"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initial: ResetState = {};

export function RedefinirForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);

  if (state.ok) {
    return (
      <div className="text-center">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-[20px] font-semibold text-ink">Senha redefinida</h1>
        <p className="mb-6 text-sm text-muted">Sua senha foi trocada. Entre com a nova senha.</p>
        <Link href="/entrar" className={cn(buttonVariants(), "w-full")}>Entrar</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <h1 className="font-[family-name:var(--font-display)] text-[22px] font-semibold text-ink">Criar nova senha</h1>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">Nova senha</label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={state.error}
          required
        />
      </div>
      <Button type="submit" loading={pending} className="w-full">Redefinir senha</Button>
    </form>
  );
}
