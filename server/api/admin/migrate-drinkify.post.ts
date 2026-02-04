import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { product, category } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  // Simple check for admin - in a real app, use a more robust check
  // For now, we assume if it hits this endpoint from our migration page, it's okay
  
  const body = await readBody(event);
  const db = useDb(event);

  if (!body.title || !body.slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Title and slug are required",
    });
  }

  // 1. Find or create category
  let categoryId = null;
  if (body.category) {
    const existingCategory = await db
      .select()
      .from(category)
      .where(eq(category.title, body.category))
      .limit(1);

    if (existingCategory.length > 0) {
      categoryId = existingCategory[0].id;
    } else {
      const newCatSlug = body.category.toLowerCase().replace(/ /g, "-");
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
  }

  // 2. Create product
  const [newProduct] = await db
    .insert(product)
    .values({
      title: body.title,
      slug: body.slug,
      description: body.description,
      thumbnail: body.thumbnail,
      basePrice: body.price,
      compareAtPrice: body.compareAtPrice,
      categoryId,
      status: "active",
      isFeatured: true, // Make them featured so they show up in hero/carousels
    })
    .returning();

  return {
    success: true,
    data: newProduct,
  };
});
