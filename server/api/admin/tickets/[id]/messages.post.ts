import { eq } from "drizzle-orm";
import { ticket, ticketMessage } from "~~/server/db/schema";
import { ticketMessageSchema } from "~~/server/utils/validation";

import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const validated = ticketMessageSchema.safeParse(body);

  if (!validated.success || !id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
    });
  }

  const db = useDb(event);

  try {
    const existingTicket = await db.query.ticket.findFirst({
        where: eq(ticket.id, id),
    });

    if (!existingTicket) {
        throw createError({
            statusCode: 404,
            statusMessage: "Ticket not found",
        });
    }

    // Add admin message
    const [newMessage] = await db
      .insert(ticketMessage)
      .values({
        ticketId: id,
        senderId: session.user.id,
        message: validated.data.message,
        isAdmin: true,
      })
      .returning();

    // Update ticket updatedAt and set status to pending (awaiting user response) or in_progress
    await db
      .update(ticket)
      .set({ 
        updatedAt: new Date(),
        status: "pending" 
      })
      .where(eq(ticket.id, id));

    return {
      success: true,
      data: newMessage,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to add admin message",
      message: error.message,
    });
  }
});
