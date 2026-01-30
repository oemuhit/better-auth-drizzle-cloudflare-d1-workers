import { eq } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { useIyzico, IYZICO } from "../../../utils/iyzico";
import {
  cart,
  cartItem,
  order,
  orderItem,
  product,
  productVariant,
} from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const body = await readBody(event);

  // iyzico sends token in the callback
  const { token } = body;

  if (!token) {
    // Redirect to checkout with error
    return sendRedirect(event, "/checkout?error=missing_token");
  }

  try {
    // Retrieve payment result from iyzico
    const iyzipay = useIyzico(event);
    const result = await iyzipay.retrieveCheckoutForm({
      locale: IYZICO.LOCALE.TR,
      token,
    });

    console.log("iyzico callback result:", JSON.stringify(result, null, 2));

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.error("Payment failed:", result);
      return sendRedirect(
        event,
        `/checkout?error=payment_failed&message=${encodeURIComponent(result.errorMessage || "Ödeme başarısız")}`,
      );
    }

    // Payment successful - create the order
    const basketId = result.basketId;
    if (!basketId) {
      return sendRedirect(event, "/checkout?error=missing_basket");
    }

    // Get the cart
    const userCart = await db.query.cart.findFirst({
      where: eq(cart.id, basketId),
      with: {
        items: {
          with: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    if (!userCart || !userCart.items) {
      return sendRedirect(event, "/checkout?error=cart_not_found");
    }

    // Calculate totals from cart items - prices already include tax (KDV dahil)
    let subtotal = 0;
    let taxTotal = 0;
    const orderItemsData: Array<{
      productId: string;
      productVariantId: string | null;
      productTitle: string;
      variantInfo: string | null;
      price: number;
      quantity: number;
      subtotal: number;
      total: number;
    }> = [];

    for (const item of userCart.items) {
      const itemPrice =
        item.productVariant?.price ?? item.product.basePrice ?? 0;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      // Calculate tax included in price (for invoice purposes)
      // Get product's tax rate, default to 18%
      const taxRatePercent = (item.product as any).taxRate?.rate ?? 18;
      // Formula: taxAmount = price * (taxRate / (100 + taxRate))
      const itemTax = itemTotal * (taxRatePercent / (100 + taxRatePercent));
      taxTotal += itemTax;

      // Build variant info string
      let variantInfo: string | null = null;
      if (item.productVariant) {
        const parts: string[] = [];
        if (item.productVariant.color)
          parts.push(`Renk: ${item.productVariant.color}`);
        if (item.productVariant.size)
          parts.push(`Beden: ${item.productVariant.size}`);
        if (item.productVariant.sku)
          parts.push(`SKU: ${item.productVariant.sku}`);
        if (parts.length > 0) variantInfo = parts.join(", ");
      }

      orderItemsData.push({
        productId: item.productId,
        productVariantId: item.productVariantId,
        productTitle: item.product.title,
        variantInfo,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemTotal,
        total: itemTotal,
      });
    }

    // Total is just subtotal (tax is already included in prices)
    const shippingTotal = 0;
    const total = subtotal + shippingTotal;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Note: In a real app, we'd store metadata with the payment token
    // The userId comes from the cart which was verified by iyzico
    // Payment details (paymentId, paymentMethod) should be stored in notes for now

    // Create the order
    const [newOrder] = await db
      .insert(order)
      .values({
        orderNumber,
        userId: userCart.userId,
        status: "processing", // Payment received, order is being processed
        paymentStatus: "paid",
        subtotal,
        taxTotal,
        shippingTotal,
        discountTotal: 0,
        total,
        notes: `iyzico Payment ID: ${result.paymentId}`,
      })
      .returning();

    // Create order items
    for (const item of orderItemsData) {
      await db.insert(orderItem).values({
        orderId: newOrder.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productTitle: item.productTitle,
        variantInfo: item.variantInfo,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        total: item.total,
      });

      // Decrease stock quantity if variant exists
      if (item.productVariantId) {
        const variant = await db.query.productVariant.findFirst({
          where: eq(productVariant.id, item.productVariantId),
        });
        if (variant) {
          await db
            .update(productVariant)
            .set({
              stockQuantity: Math.max(
                0,
                (variant.stockQuantity || 0) - item.quantity,
              ),
            })
            .where(eq(productVariant.id, item.productVariantId));
        }
      }
    }

    // Clear the cart
    await db.delete(cartItem).where(eq(cartItem.cartId, userCart.id));

    // Redirect to order confirmation page
    return sendRedirect(event, `/orders/${newOrder.id}?success=true`);
  } catch (error: any) {
    console.error("Payment callback error:", error);
    return sendRedirect(
      event,
      `/checkout?error=callback_error&message=${encodeURIComponent(error.message || "Bir hata oluştu")}`,
    );
  }
});
