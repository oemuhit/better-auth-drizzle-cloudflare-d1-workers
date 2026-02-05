import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  const query = getQuery(event);
  const cartItemId = query.cartItemId as string;

  if (!cartItemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart item ID is required",
    });
  }

  try {
    if (session?.user) {
      // Logged-in user: remove from D1
      const userCart = await db.query.cart.findFirst({
        where: eq(cart.userId, session.user.id),
      });

      if (!userCart) {
        throw createError({
          statusCode: 404,
          statusMessage: "Cart not found",
        });
      }

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
        data: { subtotal, itemCount },
      };
    } else {
      // Guest user: remove from KV
      const guestCartId = getCookie(event, "cart_id");
      const kv = event.context.cloudflare?.env?.GUEST_CARTS;

      if (!kv || !guestCartId) {
        throw createError({
          statusCode: 404,
          statusMessage: "Guest cart not found",
        });
      }

      const guestCartRaw = await kv.get(`cart:${guestCartId}`);
      if (!guestCartRaw) {
        throw createError({
          statusCode: 404,
          statusMessage: "Cart not found",
        });
      }

      const guestCart = JSON.parse(guestCartRaw);
      const itemIndex = guestCart.items.findIndex((i: any) => i.id === cartItemId);

      if (itemIndex === -1) {
        throw createError({
          statusCode: 404,
          statusMessage: "Cart item not found",
        });
      }

      guestCart.items.splice(itemIndex, 1);
      await kv.put(`cart:${guestCartId}`, JSON.stringify(guestCart), { expirationTtl: 60 * 60 * 24 * 7 });

      const itemCount = guestCart.items.reduce((sum: number, i: any) => sum + i.quantity, 0);

      return {
        success: true,
        message: "Item removed from cart",
        data: { subtotal: 0, itemCount },
      };
    }
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to remove item from cart",
      data: error.message,
    });
  }
});
