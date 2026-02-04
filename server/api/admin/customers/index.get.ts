import { sql, desc, eq, count } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { user, order } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);

  // Get all users with their order stats using a join
  const customers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      orderCount: count(order.id),
      totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${order.paymentStatus} = 'paid' THEN ${order.total} ELSE 0 END), 0)`,
    })
    .from(user)
    .leftJoin(order, eq(order.userId, user.id))
    .groupBy(user.id)
    .orderBy(desc(user.createdAt));

  return {
    data: customers,
    total: customers.length,
  };
});
