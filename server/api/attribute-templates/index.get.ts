import { useDb } from "../../utils/db";
import { attributeTemplate } from "../../db/schema";
import { asc, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const query = getQuery(event);

  // Optional filter for active only
  const activeOnly = query.active === "true";

  let templates;
  if (activeOnly) {
    templates = await db
      .select()
      .from(attributeTemplate)
      .where(eq(attributeTemplate.isActive, true))
      .orderBy(asc(attributeTemplate.sort), asc(attributeTemplate.name));
  } else {
    templates = await db
      .select()
      .from(attributeTemplate)
      .orderBy(asc(attributeTemplate.sort), asc(attributeTemplate.name));
  }

  return {
    data: templates,
    total: templates.length,
  };
});
