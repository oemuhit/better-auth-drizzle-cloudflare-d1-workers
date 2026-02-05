import { ticket, ticketMessage } from "~~/server/db/schema";
import { requireAdmin } from "~~/server/utils/admin";
import { asc, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);

  // TODO: Add proper admin check here
  // if (session.user.role !== 'admin') throw createError({ statusCode: 403, statusMessage: "Forbidden" });

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
      where: eq(ticket.id, id),
      with: {
        order: true,
        user: {
            columns: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        },
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
