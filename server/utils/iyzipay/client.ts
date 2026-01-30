/**
 * iyzico API Client - Cloudflare Workers Compatible
 * Uses native fetch and Web Crypto API
 * Based on official iyzipay-node implementation:
 * https://github.com/iyzico/iyzipay-node
 */

import type {
  IyzicoConfig,
  CheckoutFormInitRequest,
  CheckoutFormInitResponse,
  CheckoutFormRetrieveRequest,
  CheckoutFormRetrieveResponse,
  RefundRequest,
  RefundResponse,
  CancelRequest,
  CancelResponse,
} from "./types";

import {
  IYZICO_SANDBOX_URL,
  IYZICO_PRODUCTION_URL,
  ENDPOINTS,
} from "./constants";

import {
  generateAuthorizationHeaderV2,
  generateAuthorizationHeaderV1,
  generatePkiString,
  generateRandomString,
} from "./helpers";

// Client version header
const CLIENT_VERSION = "iyzipay-node-cf-1.0.0";

export class IyzicoClient {
  private config: IyzicoConfig;

  constructor(config: {
    apiKey: string;
    secretKey: string;
    sandbox?: boolean;
    baseUrl?: string;
  }) {
    this.config = {
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      baseUrl:
        config.baseUrl ||
        (config.sandbox !== false ? IYZICO_SANDBOX_URL : IYZICO_PRODUCTION_URL),
    };
  }

  /**
   * Make authenticated request to iyzico API
   * Uses V2 authorization (IYZWSv2) with V1 fallback header
   */
  private async request<T>(
    endpoint: string,
    body: Record<string, any>,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const randomString = generateRandomString(8);

    // Generate V2 authorization header (primary)
    const authorizationV2 = await generateAuthorizationHeaderV2(
      this.config.apiKey,
      this.config.secretKey,
      endpoint,
      body,
      randomString,
    );

    // Generate V1 authorization header (fallback)
    const pkiString = generatePkiString(body);
    const authorizationV1 = await generateAuthorizationHeaderV1(
      this.config.apiKey,
      this.config.secretKey,
      pkiString,
      randomString,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-iyzi-rnd": randomString,
        "x-iyzi-client-version": CLIENT_VERSION,
        Authorization: authorizationV2,
        Authorization_Fallback: authorizationV1,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`iyzico API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Initialize Checkout Form
   * Creates a payment session and returns the checkout form content
   */
  async initializeCheckoutForm(
    request: CheckoutFormInitRequest,
  ): Promise<CheckoutFormInitResponse> {
    return this.request<CheckoutFormInitResponse>(
      ENDPOINTS.CHECKOUT_FORM_INITIALIZE,
      request,
    );
  }

  /**
   * Retrieve Checkout Form Result
   * Gets the payment result after checkout form completion
   */
  async retrieveCheckoutForm(
    request: CheckoutFormRetrieveRequest,
  ): Promise<CheckoutFormRetrieveResponse> {
    return this.request<CheckoutFormRetrieveResponse>(
      ENDPOINTS.CHECKOUT_FORM_RETRIEVE,
      request,
    );
  }

  /**
   * Refund a payment
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    return this.request<RefundResponse>(ENDPOINTS.REFUND, request);
  }

  /**
   * Cancel a payment
   */
  async cancel(request: CancelRequest): Promise<CancelResponse> {
    return this.request<CancelResponse>(ENDPOINTS.CANCEL, request);
  }
}

/**
 * Create iyzico client from environment/config
 */
export function createIyzicoClient(config: {
  apiKey: string;
  secretKey: string;
  sandbox?: boolean;
}): IyzicoClient {
  return new IyzicoClient(config);
}
