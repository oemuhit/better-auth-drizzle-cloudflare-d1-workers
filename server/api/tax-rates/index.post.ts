import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { taxRate } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const body = await readBody(event);

  if (!body.title || !body.code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Title and code are required",
    });
  }

  try {
    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await db
        .update(taxRate)
        .set({ isDefault: false })
        .where(eq(taxRate.isDefault, true));
    }

    const [newTaxRate] = await db
      .insert(taxRate)
      .values({
        title: body.title,
        code: body.code.toUpperCase(),
        rate: body.rate ?? 0,
        isDefault: body.isDefault ?? false,
        isActive: body.isActive ?? true,
      })
      .returning();

    return {
      success: true,
      data: newTaxRate,
    };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      throw createError({
        statusCode: 409,
        statusMessage: "A tax rate with this code already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create tax rate",
      data: error.message,
    });
  }
});
