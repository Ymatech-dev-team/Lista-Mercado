"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Check } from "@/components/icons";
import { concludeListAction } from "./actions";

export function ConcludeButton() {
  async function onConfirm() {
    const res = await concludeListAction();
    if (res?.error) toast(res.error); // sucesso redireciona no servidor
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="primary" size="sm">
          <Check className="h-4 w-4" />
          Concluir compra
        </Button>
      }
      title="Concluir esta compra?"
      description="A lista vai para o histórico e não poderá mais ser editada."
      confirmLabel="Concluir"
      onConfirm={onConfirm}
    />
  );
}
