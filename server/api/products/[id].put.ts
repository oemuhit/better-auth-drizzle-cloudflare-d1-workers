import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { product, productVariant, productImage } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

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

    // Prepare update data
    const updateData: Partial<typeof product.$inferInsert> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.colors !== undefined) updateData.colors = body.colors;
    if (body.sizes !== undefined) updateData.sizes = body.sizes;
    if (body.sort !== undefined) updateData.sort = body.sort;

    // Update product
    const [updated] = await db
      .update(product)
      .set(updateData)
      .where(eq(product.id, id))
      .returning();

    // Update variants if provided
    if (body.variants && Array.isArray(body.variants)) {
      // Delete existing variants and add new ones
      await db.delete(productVariant).where(eq(productVariant.productId, id));

      for (const variant of body.variants) {
        await db.insert(productVariant).values({
          id: variant.id || undefined,
          productId: id,
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

    // Update images if provided
    if (body.images && Array.isArray(body.images)) {
      // Delete existing images and add new ones
      await db.delete(productImage).where(eq(productImage.productId, id));

      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        await db.insert(productImage).values({
          productId: id,
          url: typeof img === "string" ? img : img.url,
          alt: typeof img === "string" ? null : img.alt || null,
          sort: i,
        });
      }
    }

    // Fetch updated product with relations
    const completeProduct = await db.query.product.findFirst({
      where: eq(product.id, id),
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
    if (error.statusCode) throw error;
    if (error.message?.includes("UNIQUE constraint failed")) {
      throw createError({
        statusCode: 409,
        statusMessage: "A product with this slug already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update product",
      data: error.message,
    });
  }
});
