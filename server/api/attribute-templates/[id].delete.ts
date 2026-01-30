import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { attributeTemplate } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const id = getRouterParam(event, "id");

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

    // Delete the template
    await db.delete(attributeTemplate).where(eq(attributeTemplate.id, id));

    return {
      success: true,
      message: "Attribute template deleted successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete attribute template",
      data: error.message,
    });
  }
});
