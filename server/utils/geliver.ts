/**
 * Geliver Kargo REST API Client
 * Cloudflare Workers compatible — uses native fetch, no SDK dependency.
 * Base URL: https://api.geliver.io/api/v1
 * Auth:     Bearer <GELIVER_TOKEN>
 *
 * Flow:
 *   1. POST /shipments      → Creates shipment + starts fetching offers (async on Geliver's side)
 *   2. GET  /shipments/:id  → Poll until offers.percentageCompleted >= 100
 *   3. POST /transactions   → Accept chosen offer (deducts from balance, returns label)
 */

const GELIVER_BASE_URL = "https://api.geliver.io/api/v1";

// ─── Request types ────────────────────────────────────────────────────────────

export interface GAddress {
  name: string;
  email?: string;
  phone: string;
  address1: string;
  address2?: string;
  countryCode: string; // "TR"
  cityName: string;
  cityCode: string; // e.g. "34" for İstanbul
  districtName: string;
  zip?: string;
  shortName?: string;
  isRecipientAddress?: boolean;
}

export interface GCreateShipmentRequest {
  senderAddressID: string;
  /** Inline recipient address */
  recipientAddress?: Omit<GAddress, "isRecipientAddress">;
  recipientAddressID?: string;
  length: string;
  width: string;
  height: string;
  distanceUnit?: string; // "cm"
  weight: string;
  massUnit?: string; // "kg"
  test?: boolean;
  items?: { title: string; quantity: number }[];
  order?: {
    orderNumber: string;
    sourceIdentifier: string;
    totalAmount: string;
    totalAmountCurrency: string;
    sourceCode?: string;
  };
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface GAddressResponse {
  id: string;
  name: string;
  phone?: string;
  address1?: string;
  cityName?: string;
  districtName?: string;
  zip?: string;
  isRecipientAddress?: boolean;
  [key: string]: any;
}

/** A single carrier offer returned inside a shipment */
export interface GOfferDetail {
  id: string;
  /** Price to be charged from balance */
  totalPrice?: number;
  /** discounted price */
  totalAmount?: number;
  currency?: string;
  /** e.g. "GELIVER_STANDART", "YURTICI_KARGO" */
  providerServiceCode?: string;
  providerCode?: string;
  /** Human-readable carrier name */
  providerName?: string;
  discountRate?: number;
  [key: string]: any;
}

export interface GOffersEnvelope {
  cheapest?: GOfferDetail;
  /** 0–100, 100 means all carriers have responded */
  percentageCompleted?: number;
  list?: GOfferDetail[];
  [key: string]: any;
}

export interface GShipmentResponse {
  id: string;
  barcode?: string;
  trackingNumber?: string;
  labelURL?: string;
  responsiveLabelURL?: string;
  trackingUrl?: string;
  statusCode?: string;
  test?: boolean;
  offers?: GOffersEnvelope;
  [key: string]: any;
}

export interface GTransactionResponse {
  id: string;
  isPayed?: boolean;
  amount?: string;
  currency?: string;
  offerID?: string;
  shipment?: GShipmentResponse;
  [key: string]: any;
}

// ─── High-level result types ──────────────────────────────────────────────────

export interface GShipmentResult {
  shipmentId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  barcode?: string;
  amountCharged?: string;
  currency?: string;
  
  transactionId?: string;
}

/** Full result when listing offers (before accepting) */
export interface GShipmentOffers {
  shipmentId: string;
  offers: GOfferDetail[];
  cheapestOfferId?: string;
  percentageCompleted: number;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function geliverFetch<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${GELIVER_BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const msg =
      json?.additionalMessage ||
      json?.message ||
      `Geliver API error: HTTP ${res.status}`;
    throw new Error(msg);
  }

  // Geliver can return HTTP 200 with result:false for business-logic errors
  // e.g. "Bakiyeniz yeterli değil. Lütfen bakiye yükleyiniz."
  if (json && json.result === false) {
    const msg =
      json.message ||
      json.additionalMessage ||
      "Geliver API returned an error";
    throw new Error(msg);
  }

  // Unwrap envelope: { data: T } | T
  if (json && json.data !== undefined) return json.data as T;
  return json as T;
}

// ─── Address API ──────────────────────────────────────────────────────────────

export async function geliverCreateSender(
  token: string,
  address: Omit<GAddress, "isRecipientAddress">
): Promise<GAddressResponse> {
  return geliverFetch<GAddressResponse>(token, "POST", "/addresses", {
    ...address,
    isRecipientAddress: false,
  });
}

export async function geliverCreateRecipient(
  token: string,
  address: Omit<GAddress, "isRecipientAddress">
): Promise<GAddressResponse> {
  return geliverFetch<GAddressResponse>(token, "POST", "/addresses", {
    ...address,
    isRecipientAddress: true,
  });
}

// ─── City / District API ──────────────────────────────────────────────────────

export interface GCity {
  code: string;
  name: string;
  [key: string]: any;
}

export interface GDistrict {
  id: number;
  name: string;
  cityCode?: string;
  [key: string]: any;
}

/**
 * Fetch all cities for a country from Geliver.
 * GET /cities?countryCode=TR
 */
export async function geliverGetCities(
  token: string,
  countryCode = "TR"
): Promise<GCity[]> {
  const result = await geliverFetch<any>(
    token,
    "GET",
    `/cities?countryCode=${encodeURIComponent(countryCode)}`
  );
  // Geliver may return { data: [...] } already unwrapped, or a direct array
  return Array.isArray(result) ? result : (result ?? []);
}

/**
 * Fetch districts for a city from Geliver.
 * GET /districts?countryCode=TR&cityCode=34
 */
export async function geliverGetDistricts(
  token: string,
  cityCode: string,
  countryCode = "TR"
): Promise<GDistrict[]> {
  const result = await geliverFetch<any>(
    token,
    "GET",
    `/districts?countryCode=${encodeURIComponent(countryCode)}&cityCode=${encodeURIComponent(cityCode)}`
  );
  return Array.isArray(result) ? result : (result ?? []);
}

// ─── Shipment API ─────────────────────────────────────────────────────────────

/**
 * Create a shipment. Geliver starts collecting carrier offers asynchronously.
 * Use geliverGetShipment() to poll until offers.percentageCompleted === 100.
 */
export async function geliverCreateShipment(
  token: string,
  req: GCreateShipmentRequest
): Promise<GShipmentResponse> {
  const payload: any = { ...req };
  for (const k of ["length", "width", "height", "weight"] as const) {
    if (payload[k] !== undefined && payload[k] !== null) {
      payload[k] = String(payload[k]);
    }
  }
  if (payload.order && !payload.order.sourceCode) {
    payload.order.sourceCode = "API";
  }
  return geliverFetch<GShipmentResponse>(token, "POST", "/shipments", payload);
}

/**
 * Fetch a single shipment by ID (includes current offer list).
 */
export async function geliverGetShipment(
  token: string,
  shipmentId: string
): Promise<GShipmentResponse> {
  return geliverFetch<GShipmentResponse>(
    token,
    "GET",
    `/shipments/${encodeURIComponent(shipmentId)}`
  );
}

/**
 * Poll until offers.percentageCompleted >= minPercent (default 100).
 * Waits up to maxWaitMs milliseconds total, polling every intervalMs.
 * Returns the shipment with offers populated.
 */
export async function geliverWaitForOffers(
  token: string,
  shipmentId: string,
  opts: { minPercent?: number; maxWaitMs?: number; intervalMs?: number } = {}
): Promise<GShipmentResponse> {
  const minPercent = opts.minPercent ?? 80; // 80% is usually enough carriers
  const maxWaitMs = opts.maxWaitMs ?? 12_000;
  const intervalMs = opts.intervalMs ?? 1_500;
  const deadline = Date.now() + maxWaitMs;

  let shipment = await geliverGetShipment(token, shipmentId);
  while (
    (shipment.offers?.percentageCompleted ?? 0) < minPercent &&
    Date.now() < deadline
  ) {
    await new Promise((r) => setTimeout(r, intervalMs));
    shipment = await geliverGetShipment(token, shipmentId);
  }

  return shipment;
}

// ─── Transaction / Accept Offer API ──────────────────────────────────────────

/**
 * Accept (purchase) an offer by its ID.
 * Deducts from Geliver balance and returns a Transaction with
 * the updated Shipment (barcode, labelURL, trackingNumber).
 */
export async function geliverAcceptOffer(
  token: string,
  offerId: string
): Promise<GTransactionResponse> {

  return geliverFetch<GTransactionResponse>(token, "POST", "/transactions", {
    offerID: offerId,
  });
}

/**
 * Cancel a shipment by ID.
 * Geliver: DELETE /shipments/{id}
 * Returns the cancelled shipment or throws on failure.
 */
export async function geliverCancelShipment(
  token: string,
  shipmentId: string
): Promise<GShipmentResponse> {
  return geliverFetch<GShipmentResponse>(
    token,
    "DELETE",
    `/shipments/${encodeURIComponent(shipmentId)}`
  );
}

/**
 * Create a return shipment for an existing shipment.
 * Docs: https://docs.geliver.io/docs/shipments_and_transaction/return_shipment
 *
 * curl --location 'https://api.geliver.io/api/v1/shipments/shipmentID' \\
 *  --header 'Content-Type: application/json' \\
 *  --header 'Authorization: Bearer {{bearerToken}}' \\
 *  --data '{
 *    "isReturn": true,
 *    "willAccept": true,
 *    "providerServiceCode": "SURAT_STANDART",
 *    "count": 1,
 *    "senderAddress": { ... }
 *  }'
 */
export interface GReturnSenderAddress {
  name: string;
  phone?: string;
  address1: string;
  countryCode: string; // e.g. "TR"
  cityCode: string;
  districtName: string;
}

export interface GCreateReturnRequest {
  willAccept: boolean;
  providerServiceCode: string;
  count: number;
  senderAddress: GReturnSenderAddress;
}

export async function geliverCreateReturn(
  token: string,
  shipmentId: string,
  req: GCreateReturnRequest
): Promise<GShipmentResponse> {
  return geliverFetch<GShipmentResponse>(
    token,
    "POST",
    `/shipments/${encodeURIComponent(shipmentId)}`,
    {
      isReturn: true,
      willAccept: req.willAccept,
      providerServiceCode: req.providerServiceCode,
      count: req.count,
      senderAddress: req.senderAddress,
    }
  );
}

// ─── High-level helpers ───────────────────────────────────────────────────────

export interface CreateOrderShipmentOptions {
  token: string;
  senderAddressId: string;
  recipient: {
    name: string;
    phone: string;
    address1: string;
    cityName: string;
    cityCode: string;
    districtName: string;
    zip?: string;
    email?: string;
  };
  order: {
    orderNumber: string;
    totalAmount: number;
    currency?: string;
    items?: { title: string; quantity: number }[];
  };
  test?: boolean;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
    weight?: string;
  };
  storeUrl?: string;
}

/**
 * Step 1 of 2: Create shipment and wait for carrier offers.
 * Returns the offer list so the caller can present them to the user/admin.
 *
 * Call acceptShipmentOffer() to complete the purchase.
 */
export async function createShipmentAndGetOffers(
  opts: CreateOrderShipmentOptions
): Promise<GShipmentOffers> {
  const {
    token,
    senderAddressId,
    recipient,
    order,
    test,
    dimensions,
    storeUrl,
  } = opts;
  const dims = dimensions ?? {};

  const shipment = await geliverCreateShipment(token, {
    senderAddressID: senderAddressId,
    recipientAddress: {
      name: recipient.name,
      phone: recipient.phone,
      address1: recipient.address1,
      countryCode: "TR",
      cityName: recipient.cityName,
      cityCode: recipient.cityCode,
      districtName: recipient.districtName,
      zip: recipient.zip,
      email: recipient.email,
    },
    length: dims.length ?? "10",
    width: dims.width ?? "10",
    height: dims.height ?? "10",
    distanceUnit: "cm",
    weight: dims.weight ?? "1",
    massUnit: "kg",
    test: test ?? false,
    items: order.items ?? [{ title: "Sipariş ürünleri", quantity: 1 }],
    order: {
      orderNumber: order.orderNumber,
      sourceIdentifier: storeUrl ?? "https://api.geliver.io",
      totalAmount: String(order.totalAmount),
      totalAmountCurrency: order.currency ?? "TL",
      sourceCode: "API",
    },
  });

  // Poll for offers
  const withOffers = await geliverWaitForOffers(token, shipment.id, {
    minPercent: 80,
    maxWaitMs: 12_000,
    intervalMs: 1_500,
  });

  const offerList: GOfferDetail[] = withOffers.offers?.list ?? [];
  // Include cheapest if list is missing
  if (offerList.length === 0 && withOffers.offers?.cheapest) {
    offerList.push(withOffers.offers.cheapest);
  }

  return {
    shipmentId: withOffers.id,
    offers: offerList,
    cheapestOfferId: withOffers.offers?.cheapest?.id,
    percentageCompleted: withOffers.offers?.percentageCompleted ?? 0,
  };
}

/**
 * Step 2 of 2: Accept a specific offer (by ID) and finalize the shipment.
 * Returns tracking/label details.
 */
export async function acceptShipmentOffer(
  token: string,
  offerId: string
): Promise<GShipmentResult & { amountCharged?: string; currency?: string }> {
  const transaction = await geliverAcceptOffer(token, offerId);

  const s = transaction.shipment;

  return {
    shipmentId: s?.id ?? "",
    trackingNumber: s?.trackingNumber ?? undefined,
    trackingUrl: s?.trackingUrl,
    labelUrl: s?.labelURL,
    barcode: s?.barcode,
    transactionId: transaction.id,
    amountCharged: transaction.amount,
    currency: transaction.currency,
  };
}

/**
 * Convenience: create shipment, wait for offers, auto-accept cheapest.
 * Use when you don't need manual offer selection.
 */
export async function createOrderShipment(
  opts: CreateOrderShipmentOptions
): Promise<GShipmentResult> {
  const offerResult = await createShipmentAndGetOffers(opts);

  if (!offerResult.cheapestOfferId && offerResult.offers.length === 0) {
    console.warn(
      `[Geliver] No offers available for shipment ${offerResult.shipmentId}. Returning without transaction.`
    );
    return { shipmentId: offerResult.shipmentId };
  }

  const offerId =
    offerResult.cheapestOfferId ?? offerResult.offers[0]?.id ?? "";

  if (!offerId) {
    return { shipmentId: offerResult.shipmentId };
  }

  const result = await acceptShipmentOffer(opts.token, offerId);
  return result;
}
