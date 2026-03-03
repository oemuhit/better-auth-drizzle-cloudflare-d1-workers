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
    const result = await db.delete(coupon).where(eq(coupon.id, id)).returning();

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Coupon not found",
      });
    }

    return {
      success: true,
      message: "Coupon deleted successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete coupon",
      data: error.message,
    });
  }
});
