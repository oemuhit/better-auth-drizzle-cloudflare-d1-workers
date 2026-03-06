/**
 * Application-wide Contants
 * Centralizes configuration values, magic numbers, and ENUMs to prevent hardcoded inconsistencies.
 */

export const ECOMMERCE_CONFIG = {
  // Default tax rate applied to products if not otherwise specified
  DEFAULT_TAX_RATE: 18,
  
  // Default weight metric
  DEFAULT_WEIGHT_UNIT: 'g',

  // Default dimension metric
  DEFAULT_DIMENSION_UNIT: 'cm',

  // Supported Currencies
  CURRENCY_TRY: 'TRY',
  CURRENCY_USD: 'USD',
  CURRENCY_EUR: 'EUR',

  // Stock Thresholds
  LOW_STOCK_THRESHOLD: 5,
} as const;

export const IYZICO_CONFIG = {
  DEFAULT_BASKET_ITEM_TYPE: 'PHYSICAL',
  IP_FALLBACK_SANDBOX: '85.34.78.112', // Localhost IP breaks Iyzico Sandbox
  PAYMENT_GROUP: 'PRODUCT',
  LOCALE: 'tr',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

export const PAYMENT_STATUSES = {
  NOT_PAID: 'not_paid',
  AWAITING: 'awaiting',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed', // Future support for explicit failures
} as const;
