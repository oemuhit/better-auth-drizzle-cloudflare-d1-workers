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
    const foundCategory = await db.query.category.findFirst({
      where: eq(category.id, id),
      with: {
        parentCategory: true,
        subCategories: true,
        products: {
          where: (product, { eq }) => eq(product.status, "active"),
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
