import { sql } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { user, order } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);

  // Get all users with their order stats
  const customers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      orderCount:
        sql<number>`(SELECT COUNT(*) FROM "order" WHERE "order"."user_id" = ${user.id})`.as(
          "order_count",
        ),
      totalSpent:
        sql<number>`(SELECT COALESCE(SUM("total"), 0) FROM "order" WHERE "order"."user_id" = ${user.id} AND "order"."payment_status" = 'paid')`.as(
          "total_spent",
        ),
    })
    .from(user)
    .orderBy(sql`${user.createdAt} DESC`);

  return {
    data: customers,
    total: customers.length,
  };
});
