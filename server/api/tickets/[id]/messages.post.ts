import { ticket, ticketMessage } from "~~/server/db/schema";
import { ticketMessageSchema } from "~~/server/utils/validation";
import { serverAuth } from "~~/server/utils/auth";
import { and, eq, sql } from "drizzle-orm";

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
  const body = await readBody(event);
  const validated = ticketMessageSchema.safeParse(body);

  if (!validated.success || !id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input or missing ID",
    });
  }

  const db = useDb(event);

  try {
    // Check if ticket exists and belongs to user
    const existingTicket = await db.query.ticket.findFirst({
      where: and(eq(ticket.id, id), eq(ticket.userId, session.user.id)),
    });

    if (!existingTicket) {
      throw createError({
        statusCode: 404,
        statusMessage: "Ticket not found",
      });
    }

    if (existingTicket.status === "closed") {
        throw createError({
            statusCode: 400,
            statusMessage: "Kapatılmış bir bilete mesaj gönderemezsiniz",
        });
    }

    // Add message
    const [newMessage] = await db
      .insert(ticketMessage)
      .values({
        ticketId: id,
        senderId: session.user.id,
        message: validated.data.message,
        isAdmin: false,
      })
      .returning();

    // Update ticket updatedAt and set status to open if it was pending
    await db
      .update(ticket)
      .set({ 
        updatedAt: new Date(),
        status: existingTicket.status === "pending" ? "open" : existingTicket.status
      })
      .where(eq(ticket.id, id));

    return {
      success: true,
      data: newMessage,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to add message",
      message: error.message,
    });
  }
});
