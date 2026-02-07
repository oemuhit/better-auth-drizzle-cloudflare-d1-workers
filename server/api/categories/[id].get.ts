import { eq, or, inArray } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { category, product } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const idOrSlug = getRouterParam(event, "id");

  if (!idOrSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID or slug is required",
    });
  }

  try {
    // Search by both id and slug
    const foundCategory = await db.query.category.findFirst({
      where: or(eq(category.id, idOrSlug), eq(category.slug, idOrSlug)),
      with: {
        parentCategory: true,
        subCategories: true,
        products: {
          where: inArray(product.status, ["active", "backordered", "out_of_stock"]),
          limit: 10,
        },
      },
    });

    if (!foundCategory) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }

    return {
      success: true,
      data: foundCategory,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch category",
      data: error.message,
    });
  }
});
