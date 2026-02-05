import { eq, sql, desc, and } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { user, order } from "../../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Customer ID is required",
    });
  }



const customers = await db
  .select({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    totalSpent: sql<number>`COALESCE(SUM(${order.total}), 0)`,
  })
  .from(user)
  .leftJoin(order, and(
    eq(order.userId, user.id),
    eq(order.paymentStatus, 'paid')
  ))
  .where(eq(user.id, id))
  .groupBy(user.id)
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
