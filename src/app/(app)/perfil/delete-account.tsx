"use client";

import { useActionState } from "react";
import { deleteAccountAction, type DeleteState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initial: DeleteState = {};

export function DeleteAccount() {
  const [state, action, pending] = useActionState(deleteAccountAction, initial);

  return (
    <details className="rounded-xl border border-hairline bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-danger">Excluir minha conta</summary>
      <div className="border-t border-hairline p-4">
        <p className="mb-3 text-sm text-muted">
          Esta ação é permanente e apaga sua conta, listas e histórico. Não dá pra desfazer. Digite{" "}
          <strong className="text-ink">EXCLUIR</strong> para confirmar.
        </p>
        <form action={action} className="space-y-3">
          <Input name="confirm" placeholder="EXCLUIR" autoComplete="off" aria-label="Confirmação" error={state.error} />
          <Button type="submit" variant="destructive" loading={pending} className="w-full">
            Excluir definitivamente
          </Button>
        </form>
      </div>
    </details>
  );
}
