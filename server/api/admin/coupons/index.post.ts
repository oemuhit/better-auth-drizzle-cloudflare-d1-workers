import { useDb } from "../../../utils/db";
import { coupon } from "../../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const body = await readBody(event);

  if (!body.code || !body.discountType || body.discountValue === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: "Code, discount type and discount value are required",
    });
  }

  try {
    const [newCoupon] = await db
      .insert(coupon)
      .values({
        code: body.code.toUpperCase(),
        discountType: body.discountType,
        discountValue: body.discountValue,
        minPurchaseAmount: body.minPurchaseAmount || 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isNewUserOnly: !!body.isNewUserOnly,
        isFirstPurchaseOnly: !!body.isFirstPurchaseOnly,
        usageLimitPerUser: body.usageLimitPerUser !== undefined ? body.usageLimitPerUser : 1,
        usageLimitTotal: body.usageLimitTotal || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      })
      .returning();

    return {
      success: true,
      data: newCoupon,
    };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed: coupon.code")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Coupon code already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create coupon",
      data: error.message,
    });
  }
});
