import { eq, and, inArray } from "drizzle-orm";
import { useDb } from "../utils/db";
import { cart, cartItem } from "../db/schema";
import { serverAuth } from "../utils/auth";

// Only run cart merge on these specific paths
const CART_MERGE_PATHS = [
  "/api/cart",
  "/api/payment",
  "/api/checkout",
];

export default defineEventHandler(async (event) => {
  // Skip if not a relevant path
  const path = event.path.split('?')[0];
  const shouldRun = CART_MERGE_PATHS.some(p => path.startsWith(p));
  if (!shouldRun) return;

  // Skip if no guest cart cookie exists (most common case)
  const cartId = getCookie(event, "cart_id");
  if (!cartId) return;

  // Quick check: skip if no session cookie exists (avoids expensive auth check)
  // Check for common session cookie names
  const sessionToken = getCookie(event, "better-auth.session_token");
  if (!sessionToken) return;

  try {
    const auth = serverAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    if (!session?.user) return;

    const kv = event.context.cloudflare?.env?.GUEST_CARTS;
    if (!kv) return;

    const guestCartRaw = await kv.get(`cart:${cartId}`);
    if (!guestCartRaw) return;

    const guestCart = JSON.parse(guestCartRaw);
    if (!guestCart.items || guestCart.items.length === 0) {
      await kv.delete(`cart:${cartId}`);
      deleteCookie(event, "cart_id");
      return;
    }

    const db = useDb(event);
    
    // Find or create user cart
    let userCart = await db.query.cart.findFirst({
      where: eq(cart.userId, session.user.id),
      with: { items: true }
    });

    if (!userCart) {
      const [newCart] = await db.insert(cart).values({ userId: session.user.id }).returning();
      userCart = { ...newCart, items: [] };
    }

    // Efficiently merge items
    const existingItems = userCart.items || [];
    
    const mergePromises = guestCart.items.map((guestItem: any) => {
      const existing = existingItems.find(i => 
        i.productId === guestItem.productId && 
        i.productVariantId === (guestItem.productVariantId || null)
      );

      if (existing) {
        return db.update(cartItem)
          .set({ quantity: existing.quantity + guestItem.quantity })
          .where(eq(cartItem.id, existing.id));
      } else {
        return db.insert(cartItem).values({
          cartId: userCart.id,
          productId: guestItem.productId,
          productVariantId: guestItem.productVariantId || null,
          quantity: guestItem.quantity
        });
      }
    });

    await Promise.all(mergePromises);

    // Cleanup guest cart
    await kv.delete(`cart:${cartId}`);
    deleteCookie(event, "cart_id");
    
    console.log(`[CartMerge] Successfully merged guest cart ${cartId} into user ${session.user.id}`);
  } catch (error) {
    console.error("[CartMerge] Error during merge:", error);
    // Don't throw, just let the request continue
  }
});
