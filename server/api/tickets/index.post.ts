import { ticket, ticketMessage, order } from "~~/server/db/schema";
import { createTicketSchema } from "~~/server/utils/validation";
import { serverAuth } from "~~/server/utils/auth";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const validated = createTicketSchema.safeParse(body);

  if (!validated.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: validated.error.flatten(),
    });
  }

  const db = useDb(event);

  try {
    // If orderId is provided, verify it belongs to the user
    if (validated.data.orderId && validated.data.orderId !== "none") {
      const orderExists = await db.query.order.findFirst({
        where: and(
          eq(order.id, validated.data.orderId),
          eq(order.userId, session.user.id)
        ),
      });

      if (!orderExists) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid order ID or order does not belong to you",
        });
      }
    }

    // Create the ticket
    const [newTicket] = await db
      .insert(ticket)
      .values({
        userId: session.user.id,
        orderId: validated.data.orderId || null,
        subject: validated.data.subject,
        category: validated.data.category,
        status: "open",
        priority: "medium",
      })
      .returning();

    // Create the initial message
    await db.insert(ticketMessage).values({
      ticketId: newTicket.id,
      senderId: session.user.id,
      message: validated.data.message,
      isAdmin: false,
    });

    return {
      success: true,
      data: newTicket,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create ticket",
      message: error.message,
    });
  }
});
