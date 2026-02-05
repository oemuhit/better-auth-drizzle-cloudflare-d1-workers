import { eq, or } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { product } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID or slug is required",
    });
  }

  try {
    // Find by ID or slug
    const foundProduct = await db.query.product.findFirst({
      where: or(eq(product.id, id), eq(product.slug, id)),
      with: {
        category: true,
        variants: {
          orderBy: (v, { asc }) => [asc(v.price)],
        },
        images: {
          orderBy: (img, { asc }) => [asc(img.sort)],
        },
      },
    });

    if (!foundProduct) {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }

    // Calculate price range from variants
    const prices = foundProduct.variants.map((v) => v.price);
    const priceRange =
      prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : foundProduct.basePrice !== null
          ? { min: foundProduct.basePrice, max: foundProduct.basePrice }
          : null;

    // Calculate total stock
    const totalStock = foundProduct.variants.length > 0
      ? foundProduct.variants.reduce((sum, v) => sum + v.stockQuantity, 0)
      : foundProduct.stockQuantity;

    // Determine stock status
    const inStock = foundProduct.trackInventory
      ? totalStock > 0
      : true;

    return {
      success: true,
      data: {
        ...foundProduct,
        priceRange,
        totalStock,
        inStock,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch product",
      data: error.message,
    });
  }
});
