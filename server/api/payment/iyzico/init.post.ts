import { eq, and } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { serverAuth } from "../../../utils/auth";
import {
  useIyzico,
  IYZICO,
  generateConversationId,
  formatIyzicoPrice,
  type IyzicoBuyer,
  type IyzicoAddress,
  type IyzicoBasketItem,
} from "../../../utils/iyzico";
import {
  cart,
  cartItem,
  product,
  productVariant,
  customerAddress,
  order,
  orderItem,
} from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });
  const body = await readBody(event);
  const config = useRuntimeConfig(event);

  // Check authentication
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Oturum açmanız gerekiyor",
    });
  }

  const userId = session.user.id;
  const { shippingAddressId, billingAddressId, notes } = body;

  if (!shippingAddressId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Teslimat adresi gerekli",
    });
  }

  try {
    // Get cart with items
    const userCart = await db.query.cart.findFirst({
      where: eq(cart.userId, userId),
      with: {
        items: {
          with: {
            product: {
              with: {
                category: true,
              },
            },
            productVariant: true,
          },
        },
      },
    });

    if (!userCart || !userCart.items || userCart.items.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Sepet boş",
      });
    }

    // Get shipping address
    const shippingAddr = await db.query.customerAddress.findFirst({
      where: eq(customerAddress.id, shippingAddressId),
    });

    if (!shippingAddr) {
      throw createError({
        statusCode: 404,
        statusMessage: "Teslimat adresi bulunamadı",
      });
    }

    // Get billing address (or use shipping address)
    const billingAddr = billingAddressId
      ? await db.query.customerAddress.findFirst({
        where: eq(customerAddress.id, billingAddressId),
      })
      : shippingAddr;

    if (!billingAddr) {
      throw createError({
        statusCode: 404,
        statusMessage: "Fatura adresi bulunamadı",
      });
    }

    // Calculate totals - prices already include tax (KDV dahil)
    let subtotal = 0;
    let taxTotal = 0;
    const basketItems: IyzicoBasketItem[] = [];

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

      basketItems.push({
        id: item.productVariant?.id || item.product.id,
        name: item.product.title,
        category1: item.product.category?.title || "Genel",
        price: formatIyzicoPrice(itemTotal),
        itemType: "PHYSICAL" as const,
      });
    }

    // Total is just subtotal (tax is already included in prices)
    const total = subtotal;

    // Generate conversation ID for tracking
    const conversationId = generateConversationId();

    // --- STOCK RESERVATION (D1-based) ---
    const { reserveStock, releaseReservation } = await import("../../../utils/stockReservation");
    const reservedVariants: string[] = [];

    try {
      for (const item of userCart.items) {
        const variantId = item.productVariantId;
        if (!variantId) continue;

        const result = await reserveStock(event, conversationId, variantId, item.quantity);
        if (!result.success) {
          throw createError({
            statusCode: 400,
            statusMessage: `${item.product.title} için stok yetersiz: ${result.error}`,
          });
        }
        reservedVariants.push(variantId);
      }
    } catch (err: any) {
      // Rollback reservations on failure
      if (reservedVariants.length > 0) {
        await releaseReservation(event, conversationId);
      }
      throw err;
    }
    // -------------------------

    // Get client IP
    const clientIp =
      getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
      getHeader(event, "x-real-ip") ||
      "85.34.78.112"; // fallback for sandbox

    // Prepare buyer info
    const buyer: IyzicoBuyer = {
      id: userId,
      name:
        shippingAddr.firstName || session.user.name?.split(" ")[0] || "Müşteri",
      surname:
        shippingAddr.lastName ||
        session.user.name?.split(" ").slice(1).join(" ") ||
        ".",
      email: session.user.email || "test@test.com",
      identityNumber: "11111111111", // TC Kimlik No - should be collected from user
      registrationAddress: shippingAddr.addressLine1,
      city: shippingAddr.city,
      country:
        shippingAddr.countryCode === "TR" ? "Turkey" : shippingAddr.countryCode,
      zipCode: shippingAddr.postalCode || "34000",
      ip: clientIp,
      gsmNumber: shippingAddr.phone || undefined,
    };

    // Prepare addresses
    const shippingAddress: IyzicoAddress = {
      contactName:
        `${shippingAddr.firstName || ""} ${shippingAddr.lastName || ""}`.trim() ||
        "Müşteri",
      address: shippingAddr.addressLine1,
      city: shippingAddr.city,
      country:
        shippingAddr.countryCode === "TR" ? "Turkey" : shippingAddr.countryCode,
      zipCode: shippingAddr.postalCode || "34000",
    };

    const billingAddress: IyzicoAddress = {
      contactName:
        `${billingAddr.firstName || ""} ${billingAddr.lastName || ""}`.trim() ||
        "Müşteri",
      address: billingAddr.addressLine1,
      city: billingAddr.city,
      country:
        billingAddr.countryCode === "TR" ? "Turkey" : billingAddr.countryCode,
      zipCode: billingAddr.postalCode || "34000",
    };

    // Build callback URL
    const siteUrl = config.public.siteUrl;
    const callbackUrl = `${siteUrl}/api/payment/iyzico/callback`;

    // Check for existing pending order for this user
    let existingPendingOrder = await db.query.order.findFirst({
      where: and(
        eq(order.userId, userId),
        eq(order.status, "pending"),
        eq(order.paymentStatus, "not_paid")
      ),
      with: {
        items: true,
      },
    });

    let activeOrder: typeof existingPendingOrder;

    if (existingPendingOrder) {
      // Update existing pending order
      await db
        .update(order)
        .set({
          shippingAddressSnapshot: shippingAddr,
          billingAddressSnapshot: billingAddr,
          subtotal,
          taxTotal,
          shippingTotal: 0,
          discountTotal: 0,
          total,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(order.id, existingPendingOrder.id));

      // Delete old order items
      await db.delete(orderItem).where(eq(orderItem.orderId, existingPendingOrder.id));

      activeOrder = existingPendingOrder;
    } else {
      // Generate order number and create new order
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const [newOrder] = await db
        .insert(order)
        .values({
          orderNumber,
          userId,
          status: "pending",
          paymentStatus: "not_paid",
          shippingAddressSnapshot: shippingAddr,
          billingAddressSnapshot: billingAddr,
          subtotal,
          taxTotal,
          shippingTotal: 0,
          discountTotal: 0,
          total,
          notes,
        })
        .returning();

      activeOrder = newOrder as unknown as typeof existingPendingOrder;
    }

    // Create order items (for both new and updated orders)
    for (const item of userCart.items) {
      const itemPrice =
        item.productVariant?.price ?? item.product.basePrice ?? 0;
      const itemTotal = itemPrice * item.quantity;

      let variantInfo: string | null = null;
      if (item.productVariant) {
        const parts: string[] = [];
        if ((item.productVariant as any).color)
          parts.push(`Renk: ${(item.productVariant as any).color}`);
        if ((item.productVariant as any).size)
          parts.push(`Beden: ${(item.productVariant as any).size}`);
        if (item.productVariant.sku)
          parts.push(`SKU: ${item.productVariant.sku}`);
        if (parts.length > 0) variantInfo = parts.join(", ");
      }

      await db.insert(orderItem).values({
        orderId: activeOrder!.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productTitle: item.product.title,
        variantInfo,
        quantity: item.quantity,
        price: itemPrice,
        subtotal: itemTotal,
        total: itemTotal,
      });
    }

    // Initialize iyzico
    const iyzipay = useIyzico(event);

    const request = {
      locale: IYZICO.LOCALE.TR,
      conversationId,
      price: formatIyzicoPrice(total),
      paidPrice: formatIyzicoPrice(total),
      currency: IYZICO.CURRENCY.TRY,
      basketId: activeOrder!.id, // Use order ID as basket ID
      paymentGroup: IYZICO.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9, 12],
      buyer,
      shippingAddress,
      billingAddress,
      basketItems,
    };

    console.log("iyzico request:", JSON.stringify(request, null, 2));

    const result = await iyzipay.initializeCheckoutForm(request);

    if (result.status !== "success") {
      console.error("iyzico init error:", result);
      // Optional: Delete the pending order if init fails? 
      // Better to keep it as "cancelled" or just leave it "pending" for analytics.
      throw createError({
        statusCode: 400,
        statusMessage: result.errorMessage || "Ödeme başlatılamadı",
      });
    }

    return {
      success: true,
      data: {
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
        conversationId,
        basketId: activeOrder!.id,
        total,
      },
    };
  } catch (error: any) {
    console.error("Payment init error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Ödeme işlemi başlatılamadı",
      data: error.message,
    });
  }
});
