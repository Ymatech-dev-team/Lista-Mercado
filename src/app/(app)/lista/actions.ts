"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { addItemSchema } from "@/lib/validation/list";
import { getOrCreateActiveList, getActiveList, completeActiveList, getCompletedLists } from "@/db/lists";
import { findOrCreateProduct, getUserProduct } from "@/db/products";
import { addItem, removeItem, restoreItem, getItemsForList } from "@/db/list-items";

export type AddItemState = { error?: string; ok?: boolean };

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
  await addItem(list.id, product.id, quantity);

  revalidatePath("/lista");
  return { ok: true };
}

export type RemovedItem = {
  listId: string;
  productId: string;
  quantity: number;
  isPurchased: boolean;
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
  };
}

// A ação recebe dados do CLIENTE — valida a forma no servidor; restoreItem valida a posse.
const restoreSchema = z.object({
  listId: z.string(),
  productId: z.string(),
  quantity: z.coerce.number().int().min(1).max(9999).catch(1),
  isPurchased: z.boolean().catch(false),
});

export async function restoreItemAction(data: unknown): Promise<void> {
  const user = await requireUser();
  const parsed = restoreSchema.safeParse(data);
  if (!parsed.success) return;
  const { listId, productId, quantity, isPurchased } = parsed.data;
  await restoreItem(user.id, listId, productId, quantity, isPurchased);
  revalidatePath("/lista");
}

// Ação rápida da Home: adiciona um produto "mais consumido" à lista ativa (cria uma se não houver).
export async function quickAddAction(productId: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const product = await getUserProduct(user.id, productId); // valida posse (anti-IDOR)
  if (!product) return { error: "Produto não encontrado." };

  const list = await getOrCreateActiveList(user.id);
  await addItem(list.id, productId, 1);

  revalidatePath("/lista");
  revalidatePath("/inicio");
  return { ok: true };
}

// Adiciona uma sugestão (por nome) à lista ativa — reusa o produto canônico.
export async function addSuggestionAction(name: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const clean = String(name ?? "").trim().slice(0, 80);
  if (!clean) return { error: "Nome inválido." };
  const list = await getOrCreateActiveList(user.id);
  const product = await findOrCreateProduct(user.id, clean);
  await addItem(list.id, product.id, 1);
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
  for (const it of lastItems) {
    await addItem(active.id, it.productId, it.quantity);
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
