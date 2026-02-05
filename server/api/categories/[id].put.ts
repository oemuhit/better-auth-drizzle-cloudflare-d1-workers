import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { category } from "../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required",
    });
  }

  try {
    // Check if category exists
    const existing = await db.query.category.findFirst({
      where: eq(category.id, id),
    });

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }

    // Prepare update data
    const updateData: Partial<typeof category.$inferInsert> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.parentCategoryId !== undefined)
      updateData.parentCategoryId = body.parentCategoryId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.sort !== undefined) updateData.sort = body.sort;

    const [updated] = await db
      .update(category)
      .set(updateData)
      .where(eq(category.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    if (error.message?.includes("UNIQUE constraint failed")) {
      throw createError({
        statusCode: 409,
        statusMessage: "A category with this slug already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update category",
      data: error.message,
    });
  }
});
