import { useDb } from "../../utils/db";
import { product, productVariant, productImage } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const body = await readBody(event);

  // Validate required fields
  if (!body.title) {
    throw createError({
      statusCode: 400,
      statusMessage: "Title is required",
    });
  }

  // Generate slug if not provided
  const slug =
    body.slug ||
    body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  try {
    // Create product
    const [newProduct] = await db
      .insert(product)
      .values({
        title: body.title,
        slug,
        description: body.description || null,
        thumbnail: body.thumbnail || null,
        status: body.status || "active",
        categoryId: body.categoryId || null,
        colors: body.colors || [],
        sizes: body.sizes || [],
        sort: body.sort ?? 0,
      })
      .returning();

    // Create variants if provided
    if (body.variants && Array.isArray(body.variants)) {
      for (const variant of body.variants) {
        await db.insert(productVariant).values({
          productId: newProduct.id,
          sku: variant.sku || null,
          price: variant.price || 0,
          compareAtPrice: variant.compareAtPrice || null,
          color: variant.color || null,
          size: variant.size || null,
          weight: variant.weight || null,
          weightUnit: variant.weightUnit || "g",
          stockQuantity: variant.stockQuantity || 0,
          image: variant.image || null,
        });
      }
    }

    // Create images if provided
    if (body.images && Array.isArray(body.images)) {
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        await db.insert(productImage).values({
          productId: newProduct.id,
          url: typeof img === "string" ? img : img.url,
          alt: typeof img === "string" ? null : img.alt || null,
          sort: i,
        });
      }
    }

    // Fetch the complete product with relations
    const completeProduct = await db.query.product.findFirst({
      where: (p, { eq }) => eq(p.id, newProduct.id),
      with: {
        category: true,
        variants: true,
        images: true,
      },
    });

    return {
      success: true,
      data: completeProduct,
    };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      throw createError({
        statusCode: 409,
        statusMessage: "A product with this slug already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create product",
      data: error.message,
    });
  }
});
