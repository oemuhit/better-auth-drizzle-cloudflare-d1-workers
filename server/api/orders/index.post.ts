import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import {
  order,
  orderItem,
  cart,
  cartItem,
  product,
  productVariant,
} from "../../db/schema";
import { serverAuth } from "../../utils/auth";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

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

  // Validate required fields
  if (!body.shippingAddressId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping address is required",
    });
  }

  try {
    // Get user's cart
    const userCart = await db.query.cart.findFirst({
      where: eq(cart.userId, session.user.id),
      with: {
        items: {
          with: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    if (!userCart || userCart.items.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Cart is empty",
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      productVariantId: string | null;
      productTitle: string;
      variantInfo: string | null;
      quantity: number;
      price: number;
      subtotal: number;
      total: number;
    }> = [];

    for (const item of userCart.items) {
      const price = item.productVariant?.price || 0;
      const itemSubtotal = price * item.quantity;

      orderItems.push({
        productId: item.productId,
        productVariantId: item.productVariantId,
        productTitle: item.product.title,
        variantInfo: item.productVariant
          ? `${item.productVariant.color || ""} ${item.productVariant.size || ""}`.trim() ||
            null
          : null,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
        total: itemSubtotal, // Could add tax per item later
      });

      subtotal += itemSubtotal;
    }

    const taxTotal = body.taxTotal || 0;
    const shippingTotal = body.shippingTotal || 0;
    const discountTotal = body.discountTotal || 0;
    const total = subtotal + taxTotal + shippingTotal - discountTotal;

    // Create order
    const [newOrder] = await db
      .insert(order)
      .values({
        orderNumber: generateOrderNumber(),
        userId: session.user.id,
        status: "pending",
        fulfillmentStatus: "open",
        paymentStatus: "not_paid",
        billingAddressId: body.billingAddressId || body.shippingAddressId,
        shippingAddressId: body.shippingAddressId,
        subtotal,
        taxTotal,
        shippingTotal,
        discountTotal,
        total,
        notes: body.notes || null,
      })
      .returning();

    // Create order items
    for (let i = 0; i < orderItems.length; i++) {
      await db.insert(orderItem).values({
        orderId: newOrder.id,
        ...orderItems[i],
        sort: i,
      });
    }

    // Clear cart
    await db.delete(cartItem).where(eq(cartItem.cartId, userCart.id));

    // Fetch complete order
    const completeOrder = await db.query.order.findFirst({
      where: eq(order.id, newOrder.id),
      with: {
        items: {
          with: {
            product: true,
            productVariant: true,
          },
        },
        billingAddress: true,
        shippingAddress: true,
      },
    });

    return {
      success: true,
      data: completeOrder,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create order",
      data: error.message,
    });
  }
});
