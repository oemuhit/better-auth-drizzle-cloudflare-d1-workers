import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { order } from "../../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const query = getQuery(event);

  // Pagination
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  // Filters
  const status = query.status as string | undefined;
  const paymentStatus = query.paymentStatus as string | undefined;
  const fulfillmentStatus = query.fulfillmentStatus as string | undefined;
  const search = query.search as string | undefined;

  try {
    const conditions = [];

    if (status) {
      conditions.push(eq(order.status, status as any));
    }

    if (paymentStatus) {
      conditions.push(eq(order.paymentStatus, paymentStatus as any));
    }

    if (fulfillmentStatus) {
      conditions.push(eq(order.fulfillmentStatus, fulfillmentStatus as any));
    }

    if (search) {
      conditions.push(like(order.orderNumber, `%${search}%`));
    }

    const orders = await db.query.order.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(order.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(order)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch orders",
      data: error.message,
    });
  }
});
