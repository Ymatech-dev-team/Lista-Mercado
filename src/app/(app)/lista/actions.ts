"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { addItemSchema } from "@/lib/validation/list";
import { getOrCreateActiveList, getActiveList, completeActiveList, getCompletedLists, setActiveListTitle } from "@/db/lists";
import { findOrCreateProduct, getUserProduct, getRememberedPrices, setProductCategory } from "@/db/products";
import { addItem, removeItem, restoreItem, getItemsForList, setItemPrice } from "@/db/list-items";
import { isCategory } from "@/lib/categories";

export type AddItemState = { error?: string; ok?: boolean };

// Opção B (D2/RF24): ao adicionar um item que ficou SEM preço, aplica o último preço pago daquele
// produto (derivado do histórico). Editável depois; a etiqueta "lembrado" fica enquanto não mudar.
async function applyRememberedPrice(userId: string, itemId: string, productId: string, currentPrice: number | null) {
  if (currentPrice != null) return;
  const r = await getRememberedPrices(userId, [productId]);
  const cents = r[productId];
  if (cents != null) await setItemPrice(userId, itemId, cents);
}

export async function addItemAction(_prev: AddItemState, formData: FormData): Promise<AddItemState> {
  const user = await requireUser();
  const parsed = addItemSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Item inválido." };

  const { name, quantity } = parsed.data;
  const list = await getOrCreateActiveList(user.id);
  const product = await findOrCreateProduct(user.id, name);
  const item = await addItem(list.id, product.id, quantity);
  await applyRememberedPrice(user.id, item.id, product.id, item.unitPriceCents);

  revalidatePath("/lista");
  return { ok: true };
}

export type RemovedItem = {
  listId: string;
  productId: string;
  quantity: number;
  isPurchased: boolean;
  unitPriceCents: number | null;
} | null;

export async function removeItemAction(itemId: string): Promise<RemovedItem> {
  const user = await requireUser();
  const removed = await removeItem(user.id, itemId);
  revalidatePath("/lista");
  if (!removed) return null;
  return {
    listId: removed.listId,
    productId: removed.productId,
    quantity: removed.quantity,
    isPurchased: removed.isPurchased,
    unitPriceCents: removed.unitPriceCents,
  };
}

// A ação recebe dados do CLIENTE — valida a forma no servidor; restoreItem valida a posse.
// unitPriceCents: restaura o preço que havia (RF11); payload de restauração é tolerante (não é
// entrada de preço nova) → default null se ausente/inválido.
const restoreSchema = z.object({
  listId: z.string(),
  productId: z.string(),
  quantity: z.coerce.number().int().min(1).max(9999).catch(1),
  isPurchased: z.boolean().catch(false),
  unitPriceCents: z.number().int().min(0).max(9_999_999).nullable().catch(null),
});

export async function restoreItemAction(data: unknown): Promise<void> {
  const user = await requireUser();
  const parsed = restoreSchema.safeParse(data);
  if (!parsed.success) return;
  const { listId, productId, quantity, isPurchased, unitPriceCents } = parsed.data;
  await restoreItem(user.id, listId, productId, quantity, isPurchased, unitPriceCents);
  revalidatePath("/lista");
}

// Ação rápida da Home: adiciona um produto "mais consumido" à lista ativa (cria uma se não houver).
export async function quickAddAction(productId: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const product = await getUserProduct(user.id, productId); // valida posse (anti-IDOR)
  if (!product) return { error: "Produto não encontrado." };

  const list = await getOrCreateActiveList(user.id);
  const item = await addItem(list.id, productId, 1);
  await applyRememberedPrice(user.id, item.id, productId, item.unitPriceCents);

  revalidatePath("/lista");
  revalidatePath("/inicio");
  return { ok: true };
}

// Define o nome da lista ativa (garante uma lista ativa; vazio → sem nome). Máx. 60 chars.
export async function setListTitleAction(rawTitle: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const title = String(rawTitle ?? "").trim().slice(0, 60);
  await getOrCreateActiveList(user.id); // garante que existe uma lista ativa pra nomear
  await setActiveListTitle(user.id, title === "" ? null : title);
  revalidatePath("/lista");
  revalidatePath("/inicio");
  return { ok: true };
}

// Troca a categoria de um produto (edição do palpite). Persiste no produto → vale pras próximas listas.
// Server-driven (revalidate regruça a lista); escopado por dono; valida a categoria (design.md RF3).
export async function setCategoryAction(productId: string, category: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!isCategory(category)) return { error: "Categoria inválida." };
  const ok = await setProductCategory(user.id, productId, category);
  if (!ok) return { error: "Produto não encontrado." };
  revalidatePath("/lista");
  revalidatePath("/inicio");
  revalidatePath("/historico");
  return { ok: true };
}

// Adiciona uma sugestão (por nome) à lista ativa — reusa o produto canônico.
export async function addSuggestionAction(name: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const clean = String(name ?? "").trim().slice(0, 80);
  if (!clean) return { error: "Nome inválido." };
  const list = await getOrCreateActiveList(user.id);
  const product = await findOrCreateProduct(user.id, clean);
  const item = await addItem(list.id, product.id, 1);
  await applyRememberedPrice(user.id, item.id, product.id, item.unitPriceCents);
  revalidatePath("/lista");
  revalidatePath("/inicio");
  return { ok: true };
}

// Repetir última compra: recria os itens da última lista concluída na lista ativa.
export async function repeatLastAction(): Promise<{ error?: string } | void> {
  const user = await requireUser();
  const completed = await getCompletedLists(user.id);
  const last = completed[0];
  if (!last) return { error: "Você ainda não tem uma compra anterior." };

  const lastItems = await getItemsForList(user.id, last.id);
  if (lastItems.length === 0) return { error: "A última compra está vazia." };

  const active = await getOrCreateActiveList(user.id);
  const remembered = await getRememberedPrices(user.id, lastItems.map((i) => i.productId));
  for (const it of lastItems) {
    const added = await addItem(active.id, it.productId, it.quantity);
    if (added.unitPriceCents == null && remembered[it.productId] != null) {
      await setItemPrice(user.id, added.id, remembered[it.productId]);
    }
  }
  revalidatePath("/lista");
  revalidatePath("/inicio");
  redirect("/lista");
}

// Conclui a compra: lista vira histórico imutável (design.md RF5).
export async function concludeListAction(): Promise<{ error?: string } | void> {
  const user = await requireUser();
  const active = await getActiveList(user.id);
  if (!active) return { error: "Nenhuma lista ativa para concluir." };

  const items = await getItemsForList(user.id, active.id);
  if (items.length === 0) return { error: "Adicione itens antes de concluir." };

  const completed = await completeActiveList(user.id);
  if (!completed) return { error: "Não foi possível concluir agora." };

  revalidatePath("/lista");
  revalidatePath("/historico");
  redirect(`/historico/${completed.id}`);
}
