/**
 * iyzico Constants
 */

export const IYZICO_SANDBOX_URL = "https://sandbox-api.iyzipay.com";
export const IYZICO_PRODUCTION_URL = "https://api.iyzipay.com";

export const LOCALE = {
  TR: "tr" as const,
  EN: "en" as const,
};

export const CURRENCY = {
  TRY: "TRY" as const,
  USD: "USD" as const,
  EUR: "EUR" as const,
  GBP: "GBP" as const,
};

export const PAYMENT_GROUP = {
  PRODUCT: "PRODUCT" as const,
  LISTING: "LISTING" as const,
  SUBSCRIPTION: "SUBSCRIPTION" as const,
};

export const BASKET_ITEM_TYPE = {
  PHYSICAL: "PHYSICAL" as const,
  VIRTUAL: "VIRTUAL" as const,
};

export const PAYMENT_CHANNEL = {
  WEB: "WEB" as const,
  MOBILE: "MOBILE" as const,
  MOBILE_WEB: "MOBILE_WEB" as const,
  MOBILE_IOS: "MOBILE_IOS" as const,
  MOBILE_ANDROID: "MOBILE_ANDROID" as const,
};

// API Endpoints
export const ENDPOINTS = {
  CHECKOUT_FORM_INITIALIZE:
    "/payment/iyzipos/checkoutform/initialize/auth/ecom",
  CHECKOUT_FORM_RETRIEVE: "/payment/iyzipos/checkoutform/auth/ecom/detail",
  REFUND: "/payment/refund",
  CANCEL: "/payment/cancel",
};
