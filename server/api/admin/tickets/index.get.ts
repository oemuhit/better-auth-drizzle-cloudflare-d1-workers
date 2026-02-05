import { ticket } from "~~/server/db/schema";
import { requireAdmin } from "~~/server/utils/admin";
import { desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);

  const db = useDb(event);

  try {
    const allTickets = await db.query.ticket.findMany({
      orderBy: [desc(ticket.updatedAt)],
      with: {
        user: {
          columns: {
            name: true,
            email: true,
          }
        },
        order: true,
      },
    });

    return {
      success: true,
      data: allTickets,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch admin tickets",
      message: error.message,
    });
  }
});
