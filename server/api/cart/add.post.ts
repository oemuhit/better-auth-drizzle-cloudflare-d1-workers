import { eq, and, isNull } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem, product, productVariant } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    // Guest Cart Logic
    const cartId = getCookie(event, "cart_id") || crypto.randomUUID();
    setCookie(event, "cart_id", cartId, { maxAge: 60 * 60 * 24 * 7 }); // 1 week
    
    // Proceed with guest logic below
  }

  const body = await readBody(event);

  if (!body.productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const quantity = Math.max(1, Number(body.quantity) || 1);

  try {
    // Verify product exists and is active
    const productData = await db.query.product.findFirst({
      where: eq(product.id, body.productId),
      with: {
        variants: true,
      },
    });

    if (!productData) {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }

    if (productData.status !== "active") {
      throw createError({
        statusCode: 400,
        statusMessage: "Product is not available",
      });
    }

    let currentQuantityInCart = 0;
    if (session?.user) {
      const userCart = await db.query.cart.findFirst({
        where: eq(cart.userId, session.user.id),
        with: { items: true }
      });
      if (userCart) {
        const item = userCart.items.find(i => 
          i.productId === body.productId && 
          i.productVariantId === (body.productVariantId || null)
        );
        currentQuantityInCart = item?.quantity || 0;
      }
    } else {
      const cartId = getCookie(event, "cart_id");
      const kv = event.context.cloudflare?.env?.GUEST_CARTS;
      if (kv && cartId) {
        const guestCartRaw = await kv.get(`cart:${cartId}`);
        if (guestCartRaw) {
          const guestCart = JSON.parse(guestCartRaw);
          const item = guestCart.items.find((i: any) => 
            i.productId === body.productId && 
            i.productVariantId === (body.productVariantId || null)
          );
          currentQuantityInCart = item?.quantity || 0;
        }
      }
    }

    // Verify variant and check stock
    const variantId = body.productVariantId || (productData.variants.length === 1 ? productData.variants[0].id : null);
    const trackInventory = productData.trackInventory;

    if (trackInventory) {
      const { getAvailableStock } = await import("../../utils/stockReservation");
      let availableStock = 0;
      
      if (variantId) {
        availableStock = await getAvailableStock(event, variantId);
      } else {
        // Use product-level stock check
        availableStock = await getAvailableStock(event, productData.id, true);
      }

      const totalRequested = currentQuantityInCart + quantity;
      
      if (availableStock < totalRequested) {
        throw createError({
          statusCode: 400,
          statusMessage: `Stok yetersiz. Sepetinizde ${currentQuantityInCart} adet var, toplamda en fazla ${availableStock} adet alabilirsiniz.`,
        });
      }
    }

    if (session?.user) {
      // Find or create cart in D1
      let userCart = await db.query.cart.findFirst({
        where: eq(cart.userId, session.user.id),
      });

      if (!userCart) {
        const [newCart] = await db
          .insert(cart)
          .values({ userId: session.user.id })
          .returning();
        userCart = newCart;
      }

      // Check if item already in cart
      const existingItem = await db.query.cartItem.findFirst({
        where: and(
          eq(cartItem.cartId, userCart.id),
          eq(cartItem.productId, body.productId),
          body.productVariantId
            ? eq(cartItem.productVariantId, body.productVariantId)
            : isNull(cartItem.productVariantId),
        ),
      });

      if (existingItem) {
        await db
          .update(cartItem)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItem.id, existingItem.id));
      } else {
        await db.insert(cartItem).values({
          cartId: userCart.id,
          productId: body.productId,
          productVariantId: body.productVariantId || null,
          quantity,
        });
      }

      // Return updated count
      const updatedCart = await db.query.cart.findFirst({
        where: eq(cart.id, userCart.id),
        with: { items: true },
      });
      return {
        success: true,
        data: { itemCount: updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0 },
      };
    } else {
      // Guest Cart Logic with KV
      const cartId = getCookie(event, "cart_id");
      const kv = event.context.cloudflare?.env?.GUEST_CARTS;
      
      if (kv) {
        const guestCartRaw = await kv.get(`cart:${cartId}`);
        const guestCart = guestCartRaw ? JSON.parse(guestCartRaw) : { items: [] };
        
        const existingItemIndex = guestCart.items.findIndex((item: any) => 
          item.productId === body.productId && item.productVariantId === (body.productVariantId || null)
        );

        if (existingItemIndex > -1) {
          guestCart.items[existingItemIndex].quantity += quantity;
        } else {
          guestCart.items.push({
            id: crypto.randomUUID(),
            productId: body.productId,
            productVariantId: body.productVariantId || null,
            quantity
          });
        }

        await kv.put(`cart:${cartId}`, JSON.stringify(guestCart), { expirationTtl: 60 * 60 * 24 * 7 });
        
        return {
          success: true,
          data: { itemCount: guestCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0) },
        };
      } else {
        // Fallback for local dev without KV (could use session/cookie only)
        return { success: false, message: "KV not available" };
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add item to cart",
      data: error.message,
    });
  }
});
