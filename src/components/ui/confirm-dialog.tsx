"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  trigger: ReactElement;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

// Modal de confirmação acessível (Radix: foco preso, ESC, ARIA). Use para ações destrutivas.
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[color:var(--overlay)]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-hairline bg-surface p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="font-[family-name:var(--font-display)] text-[18px] font-medium text-ink">
            {title}
          </Dialog.Title>
          {description && <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>}
          <div className="mt-5 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="secondary">{cancelLabel}</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button variant={destructive ? "destructive" : "primary"} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
