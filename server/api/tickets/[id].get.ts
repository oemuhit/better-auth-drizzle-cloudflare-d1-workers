import { ticket, ticketMessage } from "~~/server/db/schema";
import { serverAuth } from "~~/server/utils/auth";
import { and, asc, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ticket ID is required",
    });
  }

  const db = useDb(event);

  try {
    const ticketData = await db.query.ticket.findFirst({
      where: and(eq(ticket.id, id), eq(ticket.userId, session.user.id)),
      with: {
        order: true,
        messages: {
          orderBy: [asc(ticketMessage.createdAt)],
          with: {
            sender: {
                columns: {
                    name: true,
                    email: true,
                    image: true
                }
            }
          }
        },
      },
    });

    if (!ticketData) {
      throw createError({
        statusCode: 404,
        statusMessage: "Ticket not found",
      });
    }

    return {
      success: true,
      data: ticketData,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch ticket detail",
      message: error.message,
    });
  }
});
