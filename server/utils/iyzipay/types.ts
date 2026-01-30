/**
 * iyzico API Types
 */

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

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
  registrationDate?: string;
  lastLoginDate?: string;
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
  locale?: "tr" | "en";
  conversationId?: string;
  price: string;
  paidPrice: string;
  currency?: "TRY" | "USD" | "EUR" | "GBP";
  basketId?: string;
  paymentGroup?: "PRODUCT" | "LISTING" | "SUBSCRIPTION";
  callbackUrl: string;
  enabledInstallments?: number[];
  buyer: IyzicoBuyer;
  shippingAddress: IyzicoAddress;
  billingAddress: IyzicoAddress;
  basketItems: IyzicoBasketItem[];
}

export interface CheckoutFormInitResponse {
  status: "success" | "failure";
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  tokenExpireTime?: number;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}

export interface CheckoutFormRetrieveRequest {
  locale?: "tr" | "en";
  conversationId?: string;
  token: string;
}

export interface ItemTransaction {
  itemId: string;
  paymentTransactionId: string;
  transactionStatus: number;
  price: number;
  paidPrice: number;
  merchantCommissionRate: number;
  merchantCommissionRateAmount: number;
  iyziCommissionRateAmount: number;
  iyziCommissionFee: number;
  blockageRate: number;
  blockageRateAmountMerchant: number;
  blockageRateAmountSubMerchant: number;
  blockageResolvedDate: string;
  subMerchantPrice: number;
  subMerchantPayoutRate: number;
  subMerchantPayoutAmount: number;
  merchantPayoutAmount: number;
}

export interface CheckoutFormRetrieveResponse {
  status: "success" | "failure";
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  price?: number;
  paidPrice?: number;
  installment?: number;
  paymentId?: string;
  fraudStatus?: number;
  merchantCommissionRate?: number;
  merchantCommissionRateAmount?: number;
  iyziCommissionRateAmount?: number;
  iyziCommissionFee?: number;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  binNumber?: string;
  lastFourDigits?: string;
  basketId?: string;
  currency?: string;
  itemTransactions?: ItemTransaction[];
  authCode?: string;
  phase?: string;
  hostReference?: string;
  token?: string;
  callbackUrl?: string;
  paymentStatus?: "SUCCESS" | "FAILURE" | "INIT_THREEDS" | "CALLBACK_THREEDS";
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}

export interface RefundRequest {
  locale?: "tr" | "en";
  conversationId?: string;
  paymentTransactionId: string;
  price: string;
  currency?: "TRY" | "USD" | "EUR" | "GBP";
  ip?: string;
}

export interface RefundResponse {
  status: "success" | "failure";
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  paymentId?: string;
  paymentTransactionId?: string;
  price?: number;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}

export interface CancelRequest {
  locale?: "tr" | "en";
  conversationId?: string;
  paymentId: string;
  ip?: string;
}

export interface CancelResponse {
  status: "success" | "failure";
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  paymentId?: string;
  price?: number;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}
