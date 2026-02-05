import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { product } from "../../db/schema";

import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  try {
    // Check if product exists
    const existing = await db.query.product.findFirst({
      where: eq(product.id, id),
    });

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }

    // Delete product (variants and images will be cascade deleted)
    await db.delete(product).where(eq(product.id, id));

    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    // Check for foreign key constraint (order items reference)
    if (error.message?.includes("FOREIGN KEY constraint failed")) {
      throw createError({
        statusCode: 409,
        statusMessage: "Cannot delete product that has been ordered",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete product",
      data: error.message,
    });
  }
});
