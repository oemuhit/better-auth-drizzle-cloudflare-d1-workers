import Iyzipay from "iyzipay";
import type { H3Event } from "h3";

// Get iyzico instance with configuration from environment
export function useIyzico(event: H3Event) {
  const config = useRuntimeConfig(event);

  // Determine if we're in sandbox mode
  const isSandbox = config.iyzicoSandbox !== "false";

  return new Iyzipay({
    apiKey: config.iyzicoApiKey,
    secretKey: config.iyzicoSecretKey,
    uri: isSandbox
      ? "https://sandbox-api.iyzipay.com"
      : "https://api.iyzipay.com",
  });
}

// iyzico constants for easy access
export const IYZICO = {
  LOCALE: {
    TR: "tr",
    EN: "en",
  },
  CURRENCY: {
    TRY: "TRY",
    EUR: "EUR",
    USD: "USD",
    GBP: "GBP",
  },
  PAYMENT_GROUP: {
    PRODUCT: "PRODUCT",
    LISTING: "LISTING",
    SUBSCRIPTION: "SUBSCRIPTION",
  },
  BASKET_ITEM_TYPE: {
    PHYSICAL: "PHYSICAL",
    VIRTUAL: "VIRTUAL",
  },
};

// Helper to generate conversation ID
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to format price for iyzico (must be string with max 2 decimal places)
export function formatIyzicoPrice(price: number): string {
  return price.toFixed(2);
}

// Type definitions for iyzico requests/responses
export interface IyzicoBuyer {
  id: string;
  name: string;
  surname: string;
  email: string;
  identityNumber: string;
  registrationAddress: string;
  city: string;
  country: string;
  zipCode: string;
  ip: string;
  gsmNumber?: string;
}

export interface IyzicoAddress {
  address: string;
  zipCode: string;
  contactName: string;
  city: string;
  country: string;
}

export interface IyzicoBasketItem {
  id: string;
  price: string;
  name: string;
  category1: string;
  category2?: string;
  itemType: "PHYSICAL" | "VIRTUAL";
}

export interface CheckoutFormInitRequest {
  locale?: string;
  conversationId?: string;
  price: string;
  paidPrice: string;
  currency?: string;
  basketId?: string;
  paymentGroup?: string;
  callbackUrl: string;
  enabledInstallments?: number[];
  buyer: IyzicoBuyer;
  shippingAddress: IyzicoAddress;
  billingAddress: IyzicoAddress;
  basketItems: IyzicoBasketItem[];
}

export interface CheckoutFormInitResponse {
  status: string;
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}

export interface CheckoutFormRetrieveResponse {
  status: string;
  paymentStatus?: string;
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  price?: number;
  paidPrice?: number;
  installment?: number;
  paymentId?: string;
  fraudStatus?: number;
  basketId?: string;
  currency?: string;
  token?: string;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  binNumber?: string;
  lastFourDigits?: string;
  itemTransactions?: Array<{
    itemId: string;
    paymentTransactionId: string;
    transactionStatus: number;
    price: number;
    paidPrice: number;
  }>;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}

// Promisified checkout form initialize
export function initializeCheckoutForm(
  iyzipay: Iyzipay,
  request: CheckoutFormInitRequest,
): Promise<CheckoutFormInitResponse> {
  return new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Promisified checkout form retrieve
export function retrieveCheckoutForm(
  iyzipay: Iyzipay,
  request: { locale?: string; conversationId?: string; token: string },
): Promise<CheckoutFormRetrieveResponse> {
  return new Promise((resolve, reject) => {
    iyzipay.checkoutForm.retrieve(request, (err: any, result: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
