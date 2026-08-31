import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { getActiveList } from "@/db/lists";
import { getItemsForList } from "@/db/list-items";
import { getMostConsumed } from "@/db/products";
import { MostConsumed } from "@/components/most-consumed";
import { AddItemForm } from "./add-item-form";
import { ListView } from "./list-view";
import { ConcludeButton } from "./conclude-button";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Minha lista — Meu Mercado" };

export default async function ListaPage() {
  const user = await requireUser();
  const list = await getActiveList(user.id);
  const items = list ? await getItemsForList(user.id, list.id) : [];
  const mostConsumed = await getMostConsumed(user.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-10 px-5 py-8 md:px-10 md:py-10">
      {/* coluna principal */}
      <div className="min-w-0 max-w-2xl flex-1">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">lista ativa</p>
            <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold text-ink">Minha lista</h1>
          </div>
          {items.length > 0 && <ConcludeButton />}
        </header>

        <div className="mb-6">
          <AddItemForm />
        </div>

        {list ? (
          <ListView listId={list.id} initialItems={items} />
        ) : (
          <p className="py-12 text-center text-sm text-muted">Comece adicionando o primeiro item da sua lista.</p>
        )}
      </div>

      {/* painel lateral (desktop largo) */}
      {mostConsumed.length > 0 && (
        <aside className="hidden w-72 flex-none xl:block">
          <p className="mb-3 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">você sempre compra</p>
          <MostConsumed items={mostConsumed} />
        </aside>
      )}
    </div>
  );
}
