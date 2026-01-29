import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem, product, productVariant } from "../../db/schema";
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

      // Check stock
      if (variant.stockQuantity < quantity) {
        throw createError({
          statusCode: 400,
          statusMessage: "Not enough stock available",
        });
      }
    }

    // Find or create cart
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
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      await db
        .update(cartItem)
        .set({ quantity: newQuantity })
        .where(eq(cartItem.id, existingItem.id));
    } else {
      // Add new item
      await db.insert(cartItem).values({
        cartId: userCart.id,
        productId: body.productId,
        productVariantId: body.productVariantId || null,
        quantity,
      });
    }

    // Return updated cart
    const updatedCart = await db.query.cart.findFirst({
      where: eq(cart.id, userCart.id),
      with: {
        items: {
          with: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    const itemCount =
      updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return {
      success: true,
      message: "Item added to cart",
      data: {
        itemCount,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add item to cart",
      data: error.message,
    });
  }
});
