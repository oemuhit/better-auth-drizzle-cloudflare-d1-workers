import { eq } from "drizzle-orm";
import { useDb } from "~~/server/utils/db";
import { order } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order ID is required",
    });
  }

  try {
    // Check if order exists
    const existing = await db.query.order.findFirst({
      where: eq(order.id, id),
    });

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Order not found",
      });
    }

    // Prepare update data
    const updateData: Partial<typeof order.$inferInsert> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;

      // Set timestamps based on status
      if (body.status === "completed") {
        updateData.completedAt = new Date();
      } else if (body.status === "cancelled") {
        updateData.cancelledAt = new Date();
      }
    }

    if (body.fulfillmentStatus !== undefined) {
      updateData.fulfillmentStatus = body.fulfillmentStatus;
    }

    if (body.paymentStatus !== undefined) {
      updateData.paymentStatus = body.paymentStatus;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const [updated] = await db
      .update(order)
      .set(updateData)
      .where(eq(order.id, id))
      .returning();

    // Fetch complete order
    const completeOrder = await db.query.order.findFirst({
      where: eq(order.id, id),
      with: {
        items: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        billingAddress: true,
        shippingAddress: true,
      },
    });

    return {
      success: true,
      data: completeOrder,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update order status",
      data: error.message,
    });
  }
});
