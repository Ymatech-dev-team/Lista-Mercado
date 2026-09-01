import { db } from "@/db";
import { listItems, lists, products } from "@/db/schema";
import { and, desc, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";

// Personalizado: produtos que o usuário costuma comprar JUNTO com os itens da lista ativa
// (co-ocorrência em listas concluídas). Retorna display names, mais frequentes primeiro.
export async function getCoBoughtProducts(userId: string, activeProductIds: string[]): Promise<string[]> {
  if (activeProductIds.length === 0) return [];

  // 1) listas concluídas do usuário que contêm ALGUM dos produtos ativos
  const relevant = await db
    .selectDistinct({ listId: listItems.listId })
    .from(listItems)
    .innerJoin(lists, eq(lists.id, listItems.listId))
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.status, "completed"),
        isNull(lists.deletedAt),
        inArray(listItems.productId, activeProductIds)
      )
    );
  const listIds = relevant.map((r) => r.listId);
  if (listIds.length === 0) return [];

  // 2) OUTROS produtos que aparecem nessas listas (excluindo os que já estão na lista ativa)
  const rows = await db
    .select({ name: products.displayName, freq: sql<number>`count(*)::int` })
    .from(listItems)
    .innerJoin(products, eq(products.id, listItems.productId))
    .where(and(inArray(listItems.listId, listIds), notInArray(listItems.productId, activeProductIds)))
    .groupBy(products.displayName)
    .orderBy(desc(sql`count(*)`))
    .limit(6);

  return rows.map((r) => r.name);
}
