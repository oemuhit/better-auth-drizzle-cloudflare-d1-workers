import { eq } from "drizzle-orm";
import { ticket } from "~~/server/db/schema";
import { z } from "zod";
import { requireAdmin } from "~~/server/utils/admin";

const statusSchema = z.object({
  status: z.enum(["open", "closed", "pending", "in_progress"]),
});

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const validated = statusSchema.safeParse(body);

  if (!validated.success || !id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
    });
  }

  const db = useDb(event);

  try {
    const [updatedTicket] = await db
      .update(ticket)
      .set({ 
        status: validated.data.status,
        updatedAt: new Date()
      })
      .where(eq(ticket.id, id))
      .returning();

    if (!updatedTicket) {
      throw createError({
        statusCode: 404,
        statusMessage: "Ticket not found",
      });
    }

    return {
      success: true,
      data: updatedTicket,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to update ticket status",
      message: error.message,
    });
  }
});
