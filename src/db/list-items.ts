import { db } from "@/db";
import { listItems, lists, products } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

// Subconsulta de posse: o item precisa pertencer a uma lista do usuário (anti-IDOR, design.md §1).
const ownedByUser = (userId: string) =>
  sql`${listItems.listId} in (select id from lists where user_id = ${userId})`;

export async function getItemsForList(userId: string, listId: string) {
  return db
    .select({
      id: listItems.id,
      productId: listItems.productId,
      name: products.displayName,
      quantity: listItems.quantity,
      isPurchased: listItems.isPurchased,
    })
    .from(listItems)
    .innerJoin(products, eq(products.id, listItems.productId))
    .where(and(eq(listItems.listId, listId), ownedByUser(userId))) // escopado por userId
    .orderBy(listItems.createdAt); // ordem estável (não reordena ao marcar)
}

// Adiciona OU soma quantidade se o produto já está na lista (merge, design.md RF3).
export async function addItem(listId: string, productId: string, quantity: number) {
  const [row] = await db
    .insert(listItems)
    .values({ listId, productId, quantity })
    .onConflictDoUpdate({
      target: [listItems.listId, listItems.productId],
      set: { quantity: sql`${listItems.quantity} + ${quantity}`, updatedAt: new Date() },
    })
    .returning();
  return row;
}

// Estado desejado (não toggle) → idempotente. Retorna false se não achou/não é do usuário.
export async function setItemPurchased(userId: string, itemId: string, purchased: boolean) {
  const res = await db
    .update(listItems)
    .set({ isPurchased: purchased, updatedAt: new Date() })
    .where(and(eq(listItems.id, itemId), ownedByUser(userId)))
    .returning({ id: listItems.id });
  return res.length > 0;
}

// Define a quantidade (absoluto, mínimo 1). Retorna false se não achou/não é do usuário.
export async function setItemQuantity(userId: string, itemId: string, quantity: number) {
  const q = Math.max(1, Math.floor(quantity));
  const res = await db
    .update(listItems)
    .set({ quantity: q, updatedAt: new Date() })
    .where(and(eq(listItems.id, itemId), ownedByUser(userId)))
    .returning({ id: listItems.id });
  return res.length > 0;
}

export async function removeItem(userId: string, itemId: string) {
  const [row] = await db
    .delete(listItems)
    .where(and(eq(listItems.id, itemId), ownedByUser(userId)))
    .returning();
  return row ?? null;
}

export async function restoreItem(
  userId: string,
  listId: string,
  productId: string,
  quantity: number,
  isPurchased: boolean
) {
  // Valida posse da LISTA e do PRODUTO (anti-IDOR: ambos os recursos vêm do cliente, design.md §1).
  const ownsList = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
    .limit(1);
  if (!ownsList.length) return null;

  const ownsProduct = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.userId, userId), isNull(products.deletedAt)))
    .limit(1);
  if (!ownsProduct.length) return null;

  const [row] = await db
    .insert(listItems)
    .values({ listId, productId, quantity, isPurchased })
    .onConflictDoUpdate({
      target: [listItems.listId, listItems.productId],
      set: { quantity, isPurchased, updatedAt: new Date() },
    })
    .returning();
  return row;
}
