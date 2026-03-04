import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { taxRate } from "../../db/schema";
import { invalidateTaxRateCache } from "../../utils/cacheInvalidation";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Tax rate ID is required",
    });
  }

  try {
    // Check if tax rate exists
    const existing = await db
      .select()
      .from(taxRate)
      .where(eq(taxRate.id, id))
      .get();

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Tax rate not found",
      });
    }

    // Delete the tax rate
    await db.delete(taxRate).where(eq(taxRate.id, id));

    await invalidateTaxRateCache();

    return {
      success: true,
      message: "Tax rate deleted successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete tax rate",
      data: error.message,
    });
  }
});
