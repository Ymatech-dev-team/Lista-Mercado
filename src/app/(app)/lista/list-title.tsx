"use client";

import { useState } from "react";
import { toast } from "sonner";
import { setListTitleAction } from "./actions";
import { Pencil } from "@/components/icons";

// Nome editável da lista ativa. Clique no título → input inline; salva no blur/Enter (server action).
// Vazio remove o nome (volta pra "Minha lista"). Esc cancela.
export function ListTitle({ initialTitle }: { initialTitle: string | null }) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [buf, setBuf] = useState(initialTitle ?? "");
  const [editing, setEditing] = useState(false);

  async function save() {
    setEditing(false);
    const next = buf.trim().slice(0, 60);
    if (next === title) return;
    const prev = title;
    setTitle(next);
    const res = await setListTitleAction(next);
    if (res?.error) {
      setTitle(prev);
      toast(res.error);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={buf}
        onChange={(e) => setBuf(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setBuf(title);
            setEditing(false);
          }
        }}
        maxLength={60}
        placeholder="Minha lista"
        aria-label="Nome da lista"
        className="w-full max-w-[16rem] border-b border-border-field bg-transparent font-[family-name:var(--font-display)] text-[24px] font-semibold text-ink outline-none focus:border-primary"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setBuf(title);
        setEditing(true);
      }}
      className="group -my-1 flex min-h-11 min-w-0 max-w-full items-center gap-2 py-1 text-left"
      aria-label="Editar nome da lista"
    >
      <h1 className="truncate font-[family-name:var(--font-display)] text-[24px] font-semibold text-ink">{title || "Minha lista"}</h1>
      <Pencil className="h-4 w-4 flex-none text-muted opacity-60 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
