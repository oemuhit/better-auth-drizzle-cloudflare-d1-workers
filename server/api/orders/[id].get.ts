import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { order } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order ID is required",
    });
  }

  try {
    const foundOrder = await db.query.order.findFirst({
      where: and(eq(order.id, id), eq(order.userId, session.user.id)),
      with: {
        items: {
          with: {
            product: {
              with: {
                images: true,
              },
            },
            productVariant: true,
          },
        },
        billingAddress: true,
        shippingAddress: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!foundOrder) {
      throw createError({
        statusCode: 404,
        statusMessage: "Order not found",
      });
    }

    return {
      success: true,
      data: foundOrder,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch order",
      data: error.message,
    });
  }
});
