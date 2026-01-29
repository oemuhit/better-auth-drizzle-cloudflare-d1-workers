import { eq, sql, desc } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { user, order } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Customer ID is required",
    });
  }

  // Get customer with stats
  const customers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      totalSpent:
        sql<number>`(SELECT COALESCE(SUM("total"), 0) FROM "order" WHERE "order"."user_id" = ${user.id} AND "order"."payment_status" = 'paid')`.as(
          "total_spent",
        ),
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (customers.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Customer not found",
    });
  }

  // Get customer orders
  const customerOrders = await db
    .select()
    .from(order)
    .where(eq(order.userId, id))
    .orderBy(desc(order.createdAt));

  return {
    data: customers[0],
    orders: customerOrders,
  };
});
