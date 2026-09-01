"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Check } from "@/components/icons";
import { concludeListAction } from "./actions";

export function ConcludeButton({ missingCount = 0 }: { missingCount?: number }) {
  async function onConfirm() {
    const res = await concludeListAction();
    if (res?.error) toast(res.error); // sucesso redireciona no servidor
  }

  const description =
    missingCount > 0
      ? `${missingCount} ${missingCount === 1 ? "item está" : "itens estão"} sem preço — o total registrado ficará subestimado. A lista vai para o histórico e não poderá mais ser editada.`
      : "A lista vai para o histórico e não poderá mais ser editada.";

  return (
    <ConfirmDialog
      trigger={
        <Button variant="primary" size="sm">
          <Check className="h-4 w-4" />
          Concluir compra
        </Button>
      }
      title="Concluir esta compra?"
      description={description}
      confirmLabel="Concluir"
      onConfirm={onConfirm}
    />
  );
}
