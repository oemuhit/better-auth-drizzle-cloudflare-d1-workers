import { eq, and } from "drizzle-orm";
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

  const query = getQuery(event);
  const cartItemId = query.cartItemId as string;

  if (!cartItemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart item ID is required",
    });
  }

  try {
    // Find user's cart
    const userCart = await db.query.cart.findFirst({
      where: eq(cart.userId, session.user.id),
    });

    if (!userCart) {
      throw createError({
        statusCode: 404,
        statusMessage: "Cart not found",
      });
    }

    // Verify item belongs to user's cart and delete
    const item = await db.query.cartItem.findFirst({
      where: and(eq(cartItem.id, cartItemId), eq(cartItem.cartId, userCart.id)),
    });

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "Cart item not found",
      });
    }

    await db.delete(cartItem).where(eq(cartItem.id, cartItemId));

    // Return updated cart summary
    const updatedCart = await db.query.cart.findFirst({
      where: eq(cart.id, userCart.id),
      with: {
        items: {
          with: {
            productVariant: true,
          },
        },
      },
    });

    const subtotal =
      updatedCart?.items.reduce((sum, item) => {
        const price = item.productVariant?.price || 0;
        return sum + price * item.quantity;
      }, 0) || 0;

    const itemCount =
      updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return {
      success: true,
      message: "Item removed from cart",
      data: {
        subtotal,
        itemCount,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to remove item from cart",
      data: error.message,
    });
  }
});
