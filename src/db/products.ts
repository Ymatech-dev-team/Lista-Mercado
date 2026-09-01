import { db } from "@/db";
import { products, lists, listItems } from "@/db/schema";
import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { normalizeProductName, cleanDisplayName } from "@/lib/products/normalize";

// Acha o produto canônico do usuário por nome normalizado, ou cria. Sempre escopado por userId.
export async function findOrCreateProduct(userId: string, rawName: string) {
  const displayName = cleanDisplayName(rawName);
  const normalizedName = normalizeProductName(rawName);
  const [row] = await db
    .insert(products)
    .values({ userId, displayName, normalizedName })
    .onConflictDoUpdate({
      target: [products.userId, products.normalizedName],
      targetWhere: isNull(products.deletedAt),
      set: { updatedAt: new Date() },
    })
    .returning();
  return row;
}

// Produto do usuário por id (valida posse — anti-IDOR).
export async function getUserProduct(userId: string, productId: string) {
  const [row] = await db
    .select({ id: products.id, displayName: products.displayName })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.userId, userId), isNull(products.deletedAt)))
    .limit(1);
  return row ?? null;
}

// Preço lembrado: último preço pago em cada produto (snapshot da compra concluída mais recente),
// escopado por userId (anti-IDOR: reancora em lists.userId). design.md ADR-2 / RF24. Deriva do
// histórico — sem cache. Retorna mapa productId → centavos, só para quem tem preço registrado.
export async function getRememberedPrices(userId: string, productIds: string[]): Promise<Record<string, number>> {
  if (productIds.length === 0) return {};
  const rows = await db
    .selectDistinctOn([listItems.productId], {
      productId: listItems.productId,
      priceCents: listItems.unitPriceCents,
    })
    .from(listItems)
    .innerJoin(lists, eq(lists.id, listItems.listId))
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.status, "completed"),
        isNull(lists.deletedAt),
        inArray(listItems.productId, productIds),
        isNotNull(listItems.unitPriceCents)
      )
    )
    .orderBy(listItems.productId, desc(lists.completedAt)); // DISTINCT ON exige productId primeiro
  const map: Record<string, number> = {};
  for (const r of rows) if (r.priceCents != null) map[r.productId] = r.priceCents;
  return map;
}

// "Mais consumidos" (design.md RF7 / §6): frequência de listas concluídas DISTINTAS em que o
// produto apareceu MARCADO COMO COMPRADO, nos últimos 90 dias, top 10, por usuário.
export async function getMostConsumed(userId: string) {
  return db
    .select({
      productId: products.id,
      name: products.displayName,
      vezes: sql<number>`count(distinct ${lists.id})::int`,
    })
    .from(listItems)
    .innerJoin(lists, eq(lists.id, listItems.listId))
    .innerJoin(products, eq(products.id, listItems.productId))
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.status, "completed"),
        eq(listItems.isPurchased, true),
        sql`${lists.completedAt} > now() - interval '90 days'`
      )
    )
    .groupBy(products.id, products.displayName)
    .orderBy(sql`count(distinct ${lists.id}) desc`, sql`max(${lists.completedAt}) desc`)
    .limit(10);
}
