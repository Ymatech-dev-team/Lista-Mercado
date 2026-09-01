import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { getActiveList, getCompletedLists } from "@/db/lists";
import { getItemsForList } from "@/db/list-items";
import { getMostConsumed, getRememberedPrices } from "@/db/products";
import { getCoBoughtProducts } from "@/db/suggestions";
import { getCuratedSuggestions } from "@/lib/suggestions";
import { normalizeProductName } from "@/lib/products/normalize";
import { MostConsumed } from "@/components/most-consumed";
import { AddItemForm } from "./add-item-form";
import { ListView } from "./list-view";
import { RepeatButton } from "./repeat-button";
import { Suggestions, type Suggestion } from "./suggestions";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Minha lista — Meu Mercado" };

export default async function ListaPage() {
  const user = await requireUser();
  const [list, mostConsumed, completed] = await Promise.all([
    getActiveList(user.id),
    getMostConsumed(user.id),
    getCompletedLists(user.id),
  ]);
  const items = list ? await getItemsForList(user.id, list.id) : [];
  // Preço lembrado de todos os itens: aplicado no add (server), e usado p/ a etiqueta "lembrado"
  // enquanto o preço ainda for o valor lembrado (D2 opção B / RF24).
  const remembered = items.length ? await getRememberedPrices(user.id, items.map((i) => i.productId)) : {};

  // Sugestões: co-ocorrência (personalizado) + combos fixos, excluindo o que já está na lista.
  let suggestions: Suggestion[] = [];
  if (items.length > 0) {
    const coBought = await getCoBoughtProducts(user.id, items.map((i) => i.productId));
    const curated = getCuratedSuggestions(items.map((i) => i.name));
    const seen = new Set(items.map((i) => normalizeProductName(i.name)));
    const push = (name: string, reason: string) => {
      const k = normalizeProductName(name);
      if (!seen.has(k)) {
        seen.add(k);
        suggestions.push({ name, reason });
      }
    };
    coBought.forEach((n) => push(n, "você compra junto"));
    curated.forEach((n) => push(n, "combina"));
    suggestions = suggestions.slice(0, 6);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-10 px-5 py-8 md:px-10 md:py-10">
      <div className="min-w-0 max-w-2xl flex-1">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">lista ativa</p>
            <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold text-ink">Minha lista</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {completed.length > 0 && <RepeatButton />}
          </div>
        </header>

        <div className="mb-6">
          <AddItemForm />
        </div>

        {list && items.length > 0 ? (
          <>
            <ListView listId={list.id} initialItems={items} remembered={remembered} />
            <Suggestions items={suggestions} />
          </>
        ) : (
          <p className="py-12 text-center text-sm text-muted">
            {completed.length > 0
              ? 'Lista vazia. Adicione um item ou toque em "Repetir última".'
              : "Comece adicionando o primeiro item da sua lista."}
          </p>
        )}
      </div>

      {mostConsumed.length > 0 && (
        <aside className="hidden w-72 flex-none xl:block">
          <p className="mb-3 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.09em] text-muted">você sempre compra</p>
          <MostConsumed items={mostConsumed} />
        </aside>
      )}
    </div>
  );
}
