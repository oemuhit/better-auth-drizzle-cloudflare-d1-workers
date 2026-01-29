import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { category } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required",
    });
  }

  try {
    // Check if category exists
    const existing = await db.query.category.findFirst({
      where: eq(category.id, id),
      with: {
        products: true,
        subCategories: true,
      },
    });

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }

    // Check if category has products
    if (existing.products && existing.products.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "Cannot delete category with associated products",
      });
    }

    // Check if category has subcategories
    if (existing.subCategories && existing.subCategories.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "Cannot delete category with subcategories",
      });
    }

    await db.delete(category).where(eq(category.id, id));

    return {
      success: true,
      message: "Category deleted successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete category",
      data: error.message,
    });
  }
});
