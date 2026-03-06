import { useRuntimeConfig } from "#imports";
import {
  useIyzico,
  IYZICO,
  generateConversationId,
  formatIyzicoPrice,
  type IyzicoBuyer,
  type IyzicoAddress,
  type IyzicoBasketItem,
} from "../utils/iyzico";
import { ECOMMERCE_CONFIG, IYZICO_CONFIG } from "../utils/constants";
import type { CustomerAddress } from "../db/schema";
import { type H3Event, getHeader } from "h3";

export class PaymentService {
  /**
   * Initializes the Iyzico Checkout Form. Takes abstract business data
   * and converts it strictly into the exact payload expected by the Iyzico API.
   */
  static async initIyzicoCheckout(
    event: H3Event,
    params: {
      userId: string;
      orderId: string;
      subtotal: number;
      total: number;
      itemsData: any[]; // items enriched with .discountedTotal
      shippingAddr: CustomerAddress;
      billingAddr: CustomerAddress;
      userEmail: string;
      userName: string;
    }
  ) {
    const config = useRuntimeConfig(event);
    const iyzipay = useIyzico(event);

    // 1. Extract clean IPs
    const clientIp =
      getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
      getHeader(event, "x-real-ip") ||
      "85.34.78.112"; // Iyzico fails sandbox mode if IP is Localhost, use fallback.

    // 2. Format Basket Items cleanly
    const basketItems: IyzicoBasketItem[] = params.itemsData.map((item) => ({
      id: item.id,
      name: item.name,
      category1: item.category,
      price: formatIyzicoPrice(item.total),
      paidPrice: formatIyzicoPrice(item.discountedTotal ?? item.total),
      itemType: "PHYSICAL" as const,
    }));

    // 3. Format Buyer Object
    const [buyerFirstName, ...buyerLastNames] = params.userName.split(" ");
    
    const buyer: IyzicoBuyer = {
      id: params.userId,
      name: params.shippingAddr.firstName || buyerFirstName || "Müşteri",
      surname:
        params.shippingAddr.lastName ||
        buyerLastNames.join(" ") ||
        ".", // Iyzico requires a surname.
      email: params.userEmail || "test@test.com",
      identityNumber: "11111111111", // TODO: Move to real TCKN later
      registrationAddress: params.shippingAddr.addressLine1,
      city: params.shippingAddr.city,
      country:
        params.shippingAddr.countryCode === "TR" ? "Turkey" : params.shippingAddr.countryCode,
      zipCode: params.shippingAddr.postalCode || "34000",
      ip: clientIp,
      gsmNumber: params.shippingAddr.phone || undefined,
    };

    // 4. Address Details
    const shippingAddress: IyzicoAddress = {
      contactName: `${params.shippingAddr.firstName || ""} ${params.shippingAddr.lastName || ""}`.trim() || "Müşteri",
      address: params.shippingAddr.addressLine1,
      city: params.shippingAddr.city,
      country:
        params.shippingAddr.countryCode === "TR" ? "Turkey" : params.shippingAddr.countryCode,
      zipCode: params.shippingAddr.postalCode || "34000",
    };

    const billingAddress: IyzicoAddress = {
      contactName: `${params.billingAddr.firstName || ""} ${params.billingAddr.lastName || ""}`.trim() || "Müşteri",
      address: params.billingAddr.addressLine1,
      city: params.billingAddr.city,
      country:
        params.billingAddr.countryCode === "TR" ? "Turkey" : params.billingAddr.countryCode,
      zipCode: params.billingAddr.postalCode || "34000",
    };

    // 5. Construct Callback URL
    const siteUrl = config.public.siteUrl;
    const callbackUrl = `${siteUrl}/api/payment/iyzico/callback`;

    // 6. Generate Traceable ID
    const conversationId = generateConversationId();

    // 7. Fire to Gateway
    const request = {
      locale: IYZICO_CONFIG.LOCALE,
      conversationId,
      price: formatIyzicoPrice(params.subtotal),
      paidPrice: formatIyzicoPrice(params.total),
      currency: ECOMMERCE_CONFIG.CURRENCY_TRY,
      basketId: params.orderId,
      paymentGroup: IYZICO_CONFIG.PAYMENT_GROUP,
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9, 12],
      buyer,
      shippingAddress,
      billingAddress,
      basketItems,
    };

    console.log("iyzico payload:", JSON.stringify(request, null, 2));

    const result = await iyzipay.initializeCheckoutForm(request);

    if (result.status !== "success") {
      console.error("iyzico init error:", result);
      return {
        success: false,
        errorMessage: result.errorMessage || "Ödeme ağı başlatılamadı",
      };
    }

    return {
      success: true,
      data: {
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
        conversationId,
        basketId: params.orderId,
        total: params.total,
      },
    };
  }
}
