import { eq, desc, and, like, sql } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { coupon } from "../../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const query = getQuery(event);

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const search = query.search as string | undefined;
  const activeOnly = query.activeOnly === "true";

  try {
    const conditions = [];

    if (search) {
      conditions.push(like(coupon.code, `%${search}%`));
    }

    if (activeOnly) {
      conditions.push(eq(coupon.isActive, true));
    }

    const coupons = await db.query.coupon.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(coupon.createdAt)],
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(coupon)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: coupons,
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
      statusMessage: "Failed to fetch coupons",
      data: error.message,
    });
  }
});
