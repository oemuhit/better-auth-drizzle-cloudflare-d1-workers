import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    // Guest logic handled below
  }

  const body = await readBody(event);
  const { cartItemId } = body;
  const quantity = Math.max(0, Number(body.quantity));

  try {
    if (session?.user) {
      // Find user's cart
      const userCart = await db.query.cart.findFirst({
        where: eq(cart.userId, session.user.id),
      });

      if (!userCart) throw createError({ statusCode: 404, statusMessage: "Cart not found" });

      const item = await db.query.cartItem.findFirst({
        where: and(eq(cartItem.id, cartItemId), eq(cartItem.cartId, userCart.id)),
        with: { productVariant: true }
      });

      if (!item) throw createError({ statusCode: 404, statusMessage: "Item not found" });

      if (quantity > 0 && item.productVariant) {
        // D1-based stock check (considering reservations)
        const { getAvailableStock } = await import("../../utils/stockReservation");
        const availableStock = await getAvailableStock(event, item.productVariant.id);
        const additionalNeeded = quantity - item.quantity;
        
        if (additionalNeeded > 0 && availableStock < additionalNeeded) {
          throw createError({ statusCode: 400, statusMessage: `Stok yetersiz. Mevcut: ${availableStock}` });
        }
      }

      if (quantity === 0) {
        await db.delete(cartItem).where(eq(cartItem.id, cartItemId));
      } else {
        await db.update(cartItem).set({ quantity }).where(eq(cartItem.id, cartItemId));
      }
    } else {
      // Guest logic
      const cartId = getCookie(event, "cart_id");
      const kv = event.context.cloudflare?.env?.GUEST_CARTS;
      if (kv && cartId) {
        const guestCartRaw = await kv.get(`cart:${cartId}`);
        if (guestCartRaw) {
          const guestCart = JSON.parse(guestCartRaw);
          const itemIndex = guestCart.items.findIndex((i: any) => i.id === cartItemId);
          if (itemIndex > -1) {
            if (quantity === 0) {
              guestCart.items.splice(itemIndex, 1);
            } else {
              guestCart.items[itemIndex].quantity = quantity;
            }
            await kv.put(`cart:${cartId}`, JSON.stringify(guestCart), { expirationTtl: 60 * 60 * 24 * 7 });
          }
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update cart",
      data: error.message,
    });
  }
});
