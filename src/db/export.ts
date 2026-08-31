import { db } from "@/db";
import { users, lists, listItems, products } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

// LGPD — reúne todos os dados do usuário para exportação (direito de portabilidade).
export async function exportUserData(userId: string) {
  const [user] = await db
    .select({ email: users.email, criadoEm: users.createdAt, consentimentoEm: users.consentAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const userLists = await db
    .select({
      id: lists.id,
      titulo: lists.title,
      status: lists.status,
      criadaEm: lists.createdAt,
      concluidaEm: lists.completedAt,
    })
    .from(lists)
    .where(and(eq(lists.userId, userId), isNull(lists.deletedAt)));

  const items = await db
    .select({
      listId: listItems.listId,
      nome: products.displayName,
      quantidade: listItems.quantity,
      comprado: listItems.isPurchased,
    })
    .from(listItems)
    .innerJoin(products, eq(products.id, listItems.productId))
    .innerJoin(lists, eq(lists.id, listItems.listId))
    .where(eq(lists.userId, userId));

  const listas = userLists.map((l) => ({
    ...l,
    itens: items.filter((i) => i.listId === l.id).map(({ listId: _listId, ...rest }) => rest),
  }));

  return { app: "Meu Mercado", usuario: user, listas };
}
