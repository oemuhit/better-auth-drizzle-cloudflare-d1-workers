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

  const body = await readBody(event);

  if (!body.cartItemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart item ID is required",
    });
  }

  if (body.quantity === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: "Quantity is required",
    });
  }

  const quantity = Math.max(0, Number(body.quantity));

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

    // Find cart item
    const item = await db.query.cartItem.findFirst({
      where: and(
        eq(cartItem.id, body.cartItemId),
        eq(cartItem.cartId, userCart.id),
      ),
      with: {
        productVariant: true,
      },
    });

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "Cart item not found",
      });
    }

    // Check stock if variant exists
    if (item.productVariant && item.productVariant.stockQuantity < quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: "Not enough stock available",
      });
    }

    if (quantity === 0) {
      // Remove item
      await db.delete(cartItem).where(eq(cartItem.id, body.cartItemId));
    } else {
      // Update quantity
      await db
        .update(cartItem)
        .set({ quantity })
        .where(eq(cartItem.id, body.cartItemId));
    }

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
      message: quantity === 0 ? "Item removed from cart" : "Cart updated",
      data: {
        subtotal,
        itemCount,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update cart",
      data: error.message,
    });
  }
});
