import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { product, category, productImage } from "../../db/schema";

import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  try {
    const body = await readBody(event);
    const db = useDb(event);

    console.log(`[Migrate Drinkify] Processing: ${body.title} (${body.slug})`);

    if (!body.title || !body.slug) {
      throw createError({
        statusCode: 400,
        statusMessage: "Title and slug are required",
      });
    }

    // 1. Find or create category
    let categoryId = null;
    if (body.category) {
      try {
        const existingCategory = await db
          .select()
          .from(category)
          .where(eq(category.title, body.category))
          .limit(1);

        if (existingCategory.length > 0) {
          categoryId = existingCategory[0].id;
          console.log(`[Migrate Drinkify] Using existing category: ${body.category} (${categoryId})`);
        } else {
          const newCatSlug = body.category.toLowerCase().replace(/ /g, "-");
          console.log(`[Migrate Drinkify] Creating new category: ${body.category} (${newCatSlug})`);
          
          const [newCat] = await db
            .insert(category)
            .values({
              title: body.category,
              slug: newCatSlug,
              isActive: true,
            })
            .returning();
          categoryId = newCat.id;
        }
      } catch (catErr: any) {
        console.error(`[Migrate Drinkify] Category processing failed:`, catErr);
      }
    }

    // 2. Upsert Product
    const existingProduct = await db
      .select()
      .from(product)
      .where(eq(product.slug, body.slug))
      .limit(1);

    let result;

    if (existingProduct.length > 0) {
      console.log(`[Migrate Drinkify] Product ${body.slug} already exists. Updating...`);
      const [updated] = await db
        .update(product)
        .set({
          title: body.title,
          description: body.description,
          shortDescription: body.shortDescription,
          thumbnail: body.thumbnail,
          basePrice: Number(body.price) || 0,
          compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
          categoryId,
          status: "active",
          isFeatured: true,
        })
        .where(eq(product.id, existingProduct[0].id))
        .returning();
      result = updated;
    } else {
      console.log(`[Migrate Drinkify] Inserting new product: ${body.slug}`);
      const [inserted] = await db
        .insert(product)
        .values({
          title: body.title,
          slug: body.slug,
          description: body.description,
          shortDescription: body.shortDescription,
          thumbnail: body.thumbnail,
          basePrice: Number(body.price) || 0,
          compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
          categoryId,
          status: "active",
          isFeatured: true,
        })
        .returning();
      result = inserted;
    }

    // 3. Sync Gallery (product_image)
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
        console.log(`[Migrate Drinkify] Syncing ${body.images.length} gallery images for ${result.id}`);
        
        // Remove existing images to avoid duplicates and handle updates
        await db.delete(productImage).where(eq(productImage.productId, result.id));

        // Insert new images
        const imageInserts = body.images.map((url: string, index: number) => ({
            productId: result.id,
            url,
            alt: body.title,
            sort: index
        }));

        await db.insert(productImage).values(imageInserts);
    }

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    console.error(`[Migrate Drinkify] Error saving product:`, err);
    return {
      success: false,
      error: err.message || "Failed to save product to database",
      details: String(err)
    };
  }
});
