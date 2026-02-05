import { ticket } from "~~/server/db/schema";
import { serverAuth } from "~~/server/utils/auth";
import { desc, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const db = useDb(event);

  try {
    const userTickets = await db.query.ticket.findMany({
      where: eq(ticket.userId, session.user.id),
      orderBy: [desc(ticket.updatedAt)],
      with: {
        order: true,
      },
    });

    return {
      success: true,
      data: userTickets,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch tickets",
      message: error.message,
    });
  }
});
