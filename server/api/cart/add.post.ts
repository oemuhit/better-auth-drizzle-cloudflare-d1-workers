import { eq, and } from "drizzle-orm";
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

    // Verify variant if provided
    if (body.productVariantId) {
      const variant = productData.variants.find(
        (v) => v.id === body.productVariantId,
      );
      if (!variant) {
        throw createError({
          statusCode: 404,
          statusMessage: "Product variant not found",
        });
      }

      // Check available stock (considering active reservations)
      const { getAvailableStock } = await import("../../utils/stockReservation");
      const availableStock = await getAvailableStock(event, variant.id);
      
      if (availableStock < quantity) {
        throw createError({
          statusCode: 400,
          statusMessage: `Stok yetersiz. Mevcut: ${availableStock}`,
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
            : undefined,
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
