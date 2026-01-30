import { eq } from "drizzle-orm";
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

    // Generate conversation ID for tracking
    const conversationId = generateConversationId();

    // Build callback URL
    const siteUrl = config.public.siteUrl;
    const callbackUrl = `${siteUrl}/api/payment/iyzico/callback`;

    // Initialize iyzico
    const iyzipay = useIyzico(event);

    const request = {
      locale: IYZICO.LOCALE.TR,
      conversationId,
      price: formatIyzicoPrice(total),
      paidPrice: formatIyzicoPrice(total),
      currency: IYZICO.CURRENCY.TRY,
      basketId: userCart.id,
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
      throw createError({
        statusCode: 400,
        statusMessage: result.errorMessage || "Ödeme başlatılamadı",
      });
    }

    // Store payment info in session or database for later verification
    // For now, we'll return the token and let the client handle it

    return {
      success: true,
      data: {
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
        conversationId,
        basketId: userCart.id,
        total,
        // Store these for the callback
        metadata: {
          shippingAddressId,
          billingAddressId: billingAddressId || shippingAddressId,
          notes,
          subtotal,
          taxTotal,
        },
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
