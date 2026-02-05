import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { product, productVariant, productImage } from "../../db/schema";
import { createProductRequestSchema } from "../../utils/validation";

import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
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
    // Validate request body
    const result = createProductRequestSchema.partial().safeParse(body);
    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation error",
        data: result.error.format(),
      });
    }

    const validatedData = result.data;

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

    // Update product
    const { variants, images, ...updateData } = validatedData;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(product)
        .set({
          ...updateData as any,
          updatedAt: new Date(),
        })
        .where(eq(product.id, id));
    }

    // Update variants if provided
    if (body.variants && Array.isArray(body.variants)) {
      // Delete existing variants and add new ones
      await db.delete(productVariant).where(eq(productVariant.productId, id));

      for (const variant of body.variants) {
        await db.insert(productVariant).values({
          id: variant.id || undefined,
          productId: id,
          sku: variant.sku || null,
          barcode: variant.barcode || null,
          price: variant.price || 0,
          compareAtPrice: variant.compareAtPrice || null,
          costPrice: variant.costPrice || null,
          // Flexible attributes
          attributes: variant.attributes || {},
          // Weight & dimensions
          weight: variant.weight || null,
          weightUnit: variant.weightUnit || "g",
          length: variant.length || null,
          width: variant.width || null,
          height: variant.height || null,
          dimensionUnit: variant.dimensionUnit || "cm",
          // Inventory
          stockQuantity: variant.stockQuantity || 0,
          lowStockThreshold: variant.lowStockThreshold || 5,
          allowBackorder: variant.allowBackorder || false,
          // Media
          image: variant.image || null,
          images: variant.images || [],
          // Status
          isActive: variant.isActive ?? true,
          sort: variant.sort || 0,
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
        taxRate: true,
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
