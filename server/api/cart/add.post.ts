import { eq, and, isNull, sql } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem, product, productVariant } from "../../db/schema";
import { serverAuth } from "../../utils/auth";
import { getAvailableStock } from "../../utils/stockReservation";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  let cartId = getCookie(event, "cart_id");

  if (!session?.user) {
    if (!cartId) {
      cartId = crypto.randomUUID();
      setCookie(event, "cart_id", cartId, { maxAge: 60 * 60 * 24 * 7 });
    }
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
    /*
      PRODUCT QUERY
      sadece gerekli alanları çekiyoruz
    */
    const productData = await db.query.product.findFirst({
      where: eq(product.id, body.productId),
      columns: {
        id: true,
        status: true,
        trackInventory: true,
      },
      with: {
        variants: {
          columns: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!productData) {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }

    const purchasableStatuses = ["active", "backordered", "hidden"];

    if (!purchasableStatuses.includes(productData.status)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          productData.status === "out_of_stock"
            ? "Ürün şu an stokta yok."
            : "Bu ürün satışa kapalı.",
      });
    }

    /*
      VARIANT LOGIC
    */

    const activeVariants = (productData.variants || []).filter(
      (v) => v.isActive,
    );

    const variantId =
      body.productVariantId ||
      (activeVariants.length === 1 ? activeVariants[0].id : null);

    if (body.productVariantId) {
      const valid = activeVariants.some((v) => v.id === body.productVariantId);

      if (!valid) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bu varyant satışa kapalı.",
        });
      }
    }

    /*
      USER CART
    */

    let userCartId: string | null = null;

    if (session?.user) {
      const existingCart = await db.query.cart.findFirst({
        where: eq(cart.userId, session.user.id),
        columns: { id: true },
      });

      if (existingCart) {
        userCartId = existingCart.id;
      } else {
        const [newCart] = await db
          .insert(cart)
          .values({ userId: session.user.id })
          .returning({ id: cart.id });

        userCartId = newCart.id;
      }
    }

    /*
      CURRENT QUANTITY
      sadece tek item query
    */

    let currentQuantityInCart = 0;

    if (session?.user && userCartId) {
      const item = await db.query.cartItem.findFirst({
        where: and(
          eq(cartItem.cartId, userCartId),
          eq(cartItem.productId, body.productId),
          variantId
            ? eq(cartItem.productVariantId, variantId)
            : isNull(cartItem.productVariantId),
        ),
        columns: {
          quantity: true,
        },
      });

      currentQuantityInCart = item?.quantity || 0;
    } else {
      const kv = event.context.cloudflare?.env?.GUEST_CARTS;

      if (kv && cartId) {
        const raw = await kv.get(`cart:${cartId}`);

        if (raw) {
          const guestCart = JSON.parse(raw);

          const item = guestCart.items.find(
            (i: any) =>
              i.productId === body.productId &&
              i.productVariantId === (variantId || null),
          );

          currentQuantityInCart = item?.quantity || 0;
        }
      }
    }

    /*
      INVENTORY CHECK
    */

    if (productData.trackInventory) {
      const availableStock = variantId
        ? await getAvailableStock(event, variantId)
        : await getAvailableStock(event, productData.id, true);

      const totalRequested = currentQuantityInCart + quantity;

      if (availableStock < totalRequested) {
        throw createError({
          statusCode: 400,
          statusMessage: `Stok yetersiz. Sepetinizde ${currentQuantityInCart} adet var, en fazla ${availableStock} adet alabilirsiniz.`,
        });
      }
    }

    /*
      AUTH USER CART UPSERT
    */

    if (session?.user && userCartId) {
      await db
        .insert(cartItem)
        .values({
          cartId: userCartId,
          productId: body.productId,
          productVariantId: variantId,
          quantity,
        })
        .onConflictDoUpdate({
          target: [
            cartItem.cartId,
            cartItem.productId,
            cartItem.productVariantId,
          ],
          set: {
            quantity: sql`${cartItem.quantity} + ${quantity}`,
          },
        });

      const result = await db
        .select({
          count: sql<number>`sum(${cartItem.quantity})`,
        })
        .from(cartItem)
        .where(eq(cartItem.cartId, userCartId));

      return {
        success: true,
        data: {
          itemCount: result[0]?.count || 0,
        },
      };
    }

    /*
      GUEST CART KV
    */

    const kv = event.context.cloudflare?.env?.GUEST_CARTS;

    if (kv && cartId) {
      const raw = await kv.get(`cart:${cartId}`);
      const guestCart = raw ? JSON.parse(raw) : { items: [] };

      const index = guestCart.items.findIndex(
        (i: any) =>
          i.productId === body.productId &&
          i.productVariantId === (variantId || null),
      );

      if (index > -1) {
        guestCart.items[index].quantity += quantity;
      } else {
        guestCart.items.push({
          id: crypto.randomUUID(),
          productId: body.productId,
          productVariantId: variantId,
          quantity,
        });
      }

      await kv.put(`cart:${cartId}`, JSON.stringify(guestCart), {
        expirationTtl: 60 * 60 * 24 * 7,
      });

      return {
        success: true,
        data: {
          itemCount: guestCart.items.reduce(
            (sum: number, i: any) => sum + i.quantity,
            0,
          ),
        },
      };
    }

    return { success: false };
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add item to cart",
      data: error.message,
    });
  }
});
