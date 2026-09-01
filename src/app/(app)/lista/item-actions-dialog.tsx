"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactElement } from "react";
import { CATEGORIES, type Category } from "@/lib/categories";
import { Trash } from "@/components/icons";
import { cn } from "@/lib/utils";

// Ações do item (design.md ADR-6, opção C): trocar de corredor + remover, num Dialog acessível
// (reusa @radix-ui/react-dialog — sem dep nova). Escolher categoria fecha o dialog.
export function ItemActionsDialog({
  trigger,
  itemName,
  current,
  onCategoryChange,
  onRemove,
}: {
  trigger: ReactElement;
  itemName: string;
  current: string;
  onCategoryChange: (c: Category) => void;
  onRemove: () => void;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[color:var(--overlay)]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-hairline bg-surface p-5 shadow-xl focus:outline-none">
          <Dialog.Title className="truncate font-[family-name:var(--font-display)] text-[17px] font-medium text-ink">
            {itemName}
          </Dialog.Title>
          <Dialog.Description className="mt-0.5 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">
            mudar de corredor
          </Dialog.Description>

          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = c.key === current;
              return (
                <Dialog.Close asChild key={c.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!active) onCategoryChange(c.key);
                    }}
                    className={cn(
                      "h-10 rounded-lg border px-3 text-sm transition-colors",
                      active
                        ? "border-primary bg-selection text-primary-strong"
                        : "border-hairline text-ink hover:bg-surface-sunken"
                    )}
                  >
                    {c.label}
                  </button>
                </Dialog.Close>
              );
            })}
          </div>

          <div className="mt-4 border-t border-hairline pt-3">
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={onRemove}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm text-danger transition-colors hover:bg-danger-bg"
              >
                <Trash className="h-4 w-4" /> Remover item
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
