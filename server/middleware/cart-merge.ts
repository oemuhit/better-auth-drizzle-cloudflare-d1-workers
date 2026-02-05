import { eq, and } from "drizzle-orm";
import { useDb } from "../utils/db";
import { cart, cartItem } from "../db/schema";
import { serverAuth } from "../utils/auth";

export default defineEventHandler(async (event) => {
  // Only handle relevant paths to avoid overhead
  if (!event.path.startsWith("/api/")) return;

  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (session?.user) {
    const cartId = getCookie(event, "cart_id");
    const kv = event.context.cloudflare?.env?.GUEST_CARTS;

    if (kv && cartId) {
      const guestCartRaw = await kv.get(`cart:${cartId}`);
      if (guestCartRaw) {
        const db = useDb(event);
        const guestCart = JSON.parse(guestCartRaw);

        // Find or create user cart
        let userCart = await db.query.cart.findFirst({
          where: eq(cart.userId, session.user.id),
        });

        if (!userCart) {
          const [newCart] = await db.insert(cart).values({ userId: session.user.id }).returning();
          userCart = newCart;
        }

        // Merge items
        for (const guestItem of guestCart.items) {
          const existingItem = await db.query.cartItem.findFirst({
            where: and(
              eq(cartItem.cartId, userCart.id),
              eq(cartItem.productId, guestItem.productId),
              guestItem.productVariantId ? eq(cartItem.productVariantId, guestItem.productVariantId) : undefined
            )
          });

          if (existingItem) {
            await db.update(cartItem)
              .set({ quantity: existingItem.quantity + guestItem.quantity })
              .where(eq(cartItem.id, existingItem.id));
          } else {
            await db.insert(cartItem).values({
              cartId: userCart.id,
              productId: guestItem.productId,
              productVariantId: guestItem.productVariantId,
              quantity: guestItem.quantity
            });
          }
        }

        // Cleanup guest cart
        await kv.delete(`cart:${cartId}`);
        deleteCookie(event, "cart_id");
        
        console.log(`Merged guest cart ${cartId} into user ${session.user.id}`);
      }
    }
  }
});
