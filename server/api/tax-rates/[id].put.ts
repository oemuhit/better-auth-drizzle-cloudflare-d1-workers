import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { taxRate } from "../../db/schema";
import { invalidateTaxRateCache } from "../../utils/cacheInvalidation";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

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

    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await db
        .update(taxRate)
        .set({ isDefault: false })
        .where(eq(taxRate.isDefault, true));
    }

    // Prepare update data
    const updateData: Partial<typeof taxRate.$inferInsert> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.rate !== undefined) updateData.rate = body.rate;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [updated] = await db
      .update(taxRate)
      .set(updateData)
      .where(eq(taxRate.id, id))
      .returning();

    await invalidateTaxRateCache();

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update tax rate",
      data: error.message,
    });
  }
});
