import { useDb } from "../../utils/db";
import { category } from "../../db/schema";

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
    const [newCategory] = await db
      .insert(category)
      .values({
        title: body.title,
        slug,
        parentCategoryId: body.parentCategoryId || null,
        isActive: body.isActive ?? true,
        sort: body.sort ?? 0,
      })
      .returning();

    return {
      success: true,
      data: newCategory,
    };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      throw createError({
        statusCode: 409,
        statusMessage: "A category with this slug already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create category",
      data: error.message,
    });
  }
});
