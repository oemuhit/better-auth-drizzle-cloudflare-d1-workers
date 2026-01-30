import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { attributeTemplate } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Template ID is required",
    });
  }

  try {
    // Check if template exists
    const existing = await db.query.attributeTemplate.findFirst({
      where: eq(attributeTemplate.id, id),
    });

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Attribute template not found",
      });
    }

    // Prepare update data
    const updateData: Partial<typeof attributeTemplate.$inferInsert> = {};

    if (body.label !== undefined) updateData.label = body.label;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.options !== undefined) updateData.options = body.options;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.sort !== undefined) updateData.sort = body.sort;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Note: We don't allow changing the 'name' field as it may be referenced in products

    const [updated] = await db
      .update(attributeTemplate)
      .set(updateData)
      .where(eq(attributeTemplate.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update attribute template",
      data: error.message,
    });
  }
});
