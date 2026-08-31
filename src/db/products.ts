import { db } from "@/db";
import { products } from "@/db/schema";
import { isNull } from "drizzle-orm";
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
