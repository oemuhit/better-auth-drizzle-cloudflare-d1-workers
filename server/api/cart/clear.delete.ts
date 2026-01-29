import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem } from "../../db/schema";
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

  try {
    // Find user's cart
    const userCart = await db.query.cart.findFirst({
      where: eq(cart.userId, session.user.id),
    });

    if (!userCart) {
      return {
        success: true,
        message: "Cart is already empty",
      };
    }

    // Delete all cart items
    await db.delete(cartItem).where(eq(cartItem.cartId, userCart.id));

    return {
      success: true,
      message: "Cart cleared",
      data: {
        subtotal: 0,
        itemCount: 0,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to clear cart",
      data: error.message,
    });
  }
});
