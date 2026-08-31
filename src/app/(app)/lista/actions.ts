"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { addItemSchema } from "@/lib/validation/list";
import { getOrCreateActiveList } from "@/db/lists";
import { findOrCreateProduct } from "@/db/products";
import { addItem, removeItem, restoreItem } from "@/db/list-items";

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
