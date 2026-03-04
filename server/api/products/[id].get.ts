import { eq, or, inArray } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { product, productVariant } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

/** Detay sayfasında görülebilen durumlar (hidden = sadece doğrudan link) */
const VIEWABLE_STATUSES = ["active", "backordered", "out_of_stock", "hidden"] as const;

export default defineCachedEventHandler(async (event) => {
  const db = useDb(event);
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });
  const isAdminRequest = session?.user?.role === "admin";
  const includeInactiveVariants = isAdminRequest && query.includeInactiveVariants === "true";

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
          ...(includeInactiveVariants ? {} : { where: eq(productVariant.isActive, true) }),
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

    // Admin değilse: sadece görüntülenebilir durumdaki ürünleri döndür (draft/inactive = 404). Admin her durumu görebilir.
    if (!isAdminRequest && !VIEWABLE_STATUSES.includes(foundProduct.status as any)) {
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
}, {
  maxAge: 30, // 30 seconds
  name: "product-detail",
  getKey: (event) => getRouterParam(event, "id") || "",
  shouldBypassCache: (event) => {
    return getQuery(event).includeInactiveVariants === "true";
  },
});
