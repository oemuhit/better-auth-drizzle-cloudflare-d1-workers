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
    // Create product with new flexible attributes
    const [newProduct] = await db
      .insert(product)
      .values({
        title: body.title,
        slug,
        description: body.description || null,
        shortDescription: body.shortDescription || null,
        thumbnail: body.thumbnail || null,
        status: body.status || "draft",
        categoryId: body.categoryId || null,
        taxRateId: body.taxRateId || null,
        // Legacy fields
        colors: body.colors || [],
        sizes: body.sizes || [],
        // Flexible variant attributes
        variantAttributes: body.variantAttributes || {},
        // SEO
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        // Pricing
        basePrice: body.basePrice || 0,
        compareAtPrice: body.compareAtPrice || null,
        // Flags
        isFeatured: body.isFeatured || false,
        isNew: body.isNew || false,
        trackInventory: body.trackInventory ?? true,
        sort: body.sort ?? 0,
      })
      .returning();

    // Create variants if provided
    if (body.variants && Array.isArray(body.variants)) {
      for (const variant of body.variants) {
        await db.insert(productVariant).values({
          productId: newProduct.id,
          sku: variant.sku || null,
          barcode: variant.barcode || null,
          price: variant.price || 0,
          compareAtPrice: variant.compareAtPrice || null,
          costPrice: variant.costPrice || null,
          // Legacy fields
          color: variant.color || null,
          size: variant.size || null,
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
        taxRate: true,
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
