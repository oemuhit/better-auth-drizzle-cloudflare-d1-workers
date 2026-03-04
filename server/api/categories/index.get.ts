import { eq, asc, isNull } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { category } from "../../db/schema";

export default defineCachedEventHandler(async (event) => {
  const db = useDb(event);
  const query = getQuery(event);

  const includeInactive = query.includeInactive === "true";
  const parentOnly = query.parentOnly === "true";

  try {
    let whereConditions = [];

    if (!includeInactive) {
      whereConditions.push(eq(category.isActive, true));
    }

    if (parentOnly) {
      whereConditions.push(isNull(category.parentCategoryId));
    }

    const categories = await db.query.category.findMany({
      where:
        whereConditions.length > 0
          ? (fields, { and }) => and(...whereConditions.map((c) => c))
          : undefined,
      orderBy: [asc(category.sort), asc(category.title)],
      with: {
        subCategories: {
          where: !includeInactive ? eq(category.isActive, true) : undefined,
          orderBy: [asc(category.sort), asc(category.title)],
        },
      },
    });

    return {
      success: true,
      data: categories,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch categories",
      data: error.message,
    });
  }
}, {
  maxAge: 300, // 5 minutes
  name: "categories",
  getKey: (event) => {
    const q = getQuery(event);
    return `${q.parentOnly || "all"}:${q.includeInactive || "false"}`;
  },
  shouldBypassCache: (event) => {
    return getQuery(event).includeInactive === "true";
  },
});
