"use client";

import { useActionState, useEffect, useRef } from "react";
import { addItemAction, type AddItemState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "@/components/icons";

const initial: AddItemState = {};

export function AddItemForm() {
  const [state, action, pending] = useActionState(addItemAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa os campos após adicionar com sucesso (e volta o foco pro nome).
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    }
  }, [state]);

  return (
    <div>
      <form ref={formRef} action={action} className="flex items-center gap-2">
        <div className="flex-1">
          <Input name="name" placeholder="Adicionar item..." autoComplete="off" aria-label="Nome do item" required />
        </div>
        <div className="w-14 flex-none">
          <Input
            name="quantity"
            inputMode="numeric"
            defaultValue="1"
            aria-label="Quantidade"
            className="text-center font-[family-name:var(--font-num)] tabular-nums"
          />
        </div>
        <Button type="submit" size="icon" loading={pending} aria-label="Adicionar item">
          {!pending && <Plus className="h-5 w-5" />}
        </Button>
      </form>
      {state.error && <p className="mt-1.5 text-sm text-danger">{state.error}</p>}
    </div>
  );
}
