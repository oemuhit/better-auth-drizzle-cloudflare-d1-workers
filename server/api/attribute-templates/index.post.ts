import { useDb } from "../../utils/db";
import { attributeTemplate } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const body = await readBody(event);

  // Validate required fields
  if (!body.name || !body.label) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name and label are required",
    });
  }

  // Sanitize name (lowercase, alphanumeric and underscore only)
  const name = body.name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  try {
    const [newTemplate] = await db
      .insert(attributeTemplate)
      .values({
        name,
        label: body.label,
        type: body.type || "select",
        options: body.options || [],
        description: body.description || null,
        icon: body.icon || null,
        sort: body.sort ?? 0,
        isActive: body.isActive ?? true,
      })
      .returning();

    return {
      success: true,
      data: newTemplate,
    };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      throw createError({
        statusCode: 409,
        statusMessage: "An attribute template with this name already exists",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create attribute template",
      data: error.message,
    });
  }
});
