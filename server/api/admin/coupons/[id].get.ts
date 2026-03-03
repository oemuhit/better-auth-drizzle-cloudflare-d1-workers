import { eq } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { coupon } from "../../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Coupon ID is required",
    });
  }

  try {
    const existingCoupon = await db.query.coupon.findFirst({
      where: eq(coupon.id, id),
      with: {
        usages: {
          limit: 10,
          orderBy: (u, { desc }) => [desc(u.usedAt)],
          with: {
            user: {
              columns: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!existingCoupon) {
      throw createError({
        statusCode: 404,
        statusMessage: "Coupon not found",
      });
    }

    return {
      success: true,
      data: existingCoupon,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch coupon",
      data: error.message,
    });
  }
});
