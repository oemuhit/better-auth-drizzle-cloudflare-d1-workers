import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem, product } from "../../db/schema";
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
        with: { productVariant: true, product: true }
      });

      if (!item) throw createError({ statusCode: 404, statusMessage: "Item not found" });

      if (quantity > 0 && item.product.trackInventory) {
        const { getAvailableStock } = await import("../../utils/stockReservation");
        let availableStock = 0;
        
        if (item.productVariant) {
          availableStock = await getAvailableStock(event, item.productVariant.id);
        } else {
          // Use product-level stock check
          availableStock = await getAvailableStock(event, item.product.id, true);
        }
        
        if (quantity > availableStock) {
          throw createError({ statusCode: 400, statusMessage: `Stok yetersiz. En fazla ${availableStock} adet alabilirsiniz.` });
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
          const item = guestCart.items.find((i: any) => i.id === cartItemId);
          
          if (item) {
            if (quantity > 0) {
              // Fetch product data for guest stock check
              const productData = await db.query.product.findFirst({
                where: eq(product.id, item.productId)
              });

              if (productData?.trackInventory) {
                const { getAvailableStock } = await import("../../utils/stockReservation");
                let availableStock = 0;
                
                if (item.productVariantId) {
                  availableStock = await getAvailableStock(event, item.productVariantId);
                } else {
                  availableStock = await getAvailableStock(event, item.productId, true);
                }
                
                if (quantity > availableStock) {
                  throw createError({ statusCode: 400, statusMessage: `Stok yetersiz. En fazla ${availableStock} adet alabilirsiniz.` });
                }
              }
              
              item.quantity = quantity;
            } else {
              guestCart.items = guestCart.items.filter((i: any) => i.id !== cartItemId);
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
