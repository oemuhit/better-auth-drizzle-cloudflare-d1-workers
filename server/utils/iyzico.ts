/**
 * iyzico Payment Gateway Utilities
 * Cloudflare Workers Compatible - No Node.js dependencies
 */

import type { H3Event } from "h3";
import { IyzicoClient } from "./iyzipay";

// Re-export types and constants from the custom implementation
export * from "./iyzipay/types";
export * from "./iyzipay/constants";
export {
  generateConversationId,
  formatPrice as formatIyzicoPrice,
} from "./iyzipay/helpers";

// Alias for backward compatibility
export const IYZICO = {
  LOCALE: {
    TR: "tr" as const,
    EN: "en" as const,
  },
  CURRENCY: {
    TRY: "TRY" as const,
    EUR: "EUR" as const,
    USD: "USD" as const,
    GBP: "GBP" as const,
  },
  PAYMENT_GROUP: {
    PRODUCT: "PRODUCT" as const,
    LISTING: "LISTING" as const,
    SUBSCRIPTION: "SUBSCRIPTION" as const,
  },
  BASKET_ITEM_TYPE: {
    PHYSICAL: "PHYSICAL" as const,
    VIRTUAL: "VIRTUAL" as const,
  },
};

/**
 * Get iyzico client with configuration from environment
 */
export function useIyzico(event: H3Event): IyzicoClient {
  const config = useRuntimeConfig(event);

  // Determine if we're in sandbox mode
  const isSandbox = config.iyzicoSandbox !== "false";

  return new IyzicoClient({
    apiKey: config.iyzicoApiKey as string,
    secretKey: config.iyzicoSecretKey as string,
    sandbox: isSandbox,
  });
}
