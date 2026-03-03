import { eq } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { coupon } from "../../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Coupon ID is required",
    });
  }

  try {
    const [updatedCoupon] = await db
      .update(coupon)
      .set({
        code: body.code ? body.code.toUpperCase() : undefined,
        discountType: body.discountType,
        discountValue: body.discountValue,
        minPurchaseAmount: body.minPurchaseAmount,
        startDate: body.startDate ? new Date(body.startDate) : body.startDate === null ? null : undefined,
        endDate: body.endDate ? new Date(body.endDate) : body.endDate === null ? null : undefined,
        isNewUserOnly: body.isNewUserOnly,
        isFirstPurchaseOnly: body.isFirstPurchaseOnly,
        usageLimitPerUser: body.usageLimitPerUser,
        usageLimitTotal: body.usageLimitTotal,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(coupon.id, id))
      .returning();

    if (!updatedCoupon) {
      throw createError({
        statusCode: 404,
        statusMessage: "Coupon not found",
      });
    }

    return {
      success: true,
      data: updatedCoupon,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    if (error.message?.includes("UNIQUE constraint failed: coupon.code")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Coupon code already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update coupon",
      data: error.message,
    });
  }
});
