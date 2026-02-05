import { eq, desc, and, sql } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { order } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const offset = (page - 1) * limit;

  try {
    // Only show orders that have been paid (exclude pending checkout orders)
    const orders = await db.query.order.findMany({
      where: and(
        eq(order.userId, session.user.id),
        // Exclude pending orders that haven't been paid
        sql`NOT (${order.status} = 'pending' AND ${order.paymentStatus} = 'not_paid')`
      ),
      orderBy: [desc(order.createdAt)],
      limit,
      offset,
      with: {
        items: {
          with: {
            product: {
              with: {
                images: true,
              },
            },
            productVariant: true,
          },
        },
      },
    });

    return {
      success: true,
      data: orders,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch orders",
      data: error.message,
    });
  }
});
