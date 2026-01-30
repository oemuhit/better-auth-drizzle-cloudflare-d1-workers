/**
 * iyzico Helper Functions - Web Crypto API based
 * Based on official iyzipay-node implementation:
 * https://github.com/iyzico/iyzipay-node/blob/master/lib/utils.js
 */

/**
 * Generate a random string for conversation ID
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format price for iyzico (string with at least one decimal place)
 * Based on official formatPrice function
 */
export function formatPrice(price: number | string): string {
  if (
    (typeof price !== "number" && typeof price !== "string") ||
    !isFinite(Number(price))
  ) {
    return String(price);
  }
  const resultPrice = parseFloat(String(price)).toString();
  if (resultPrice.indexOf(".") === -1) {
    return resultPrice + ".0";
  }
  return resultPrice;
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate random string for iyzico API
 * Based on official generateRandomString function
 */
export function generateRandomString(size: number = 8): string {
  return Date.now().toString() + Math.random().toString(size).slice(2);
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 * This is the core signing mechanism used by iyzico V2 API
 */
async function hmacSha256(secretKey: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(data);

  // Import the secret key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // Sign the message
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);

  // Convert to hex string
  return arrayBufferToHex(signature);
}

/**
 * Generate SHA-1 hash using Web Crypto API (for V1 fallback)
 */
async function sha1(data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  return crypto.subtle.digest("SHA-1", buffer);
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Generate V2 Authorization Header (IYZWSv2)
 * Based on official generateAuthorizationHeaderV2 and generateHashV2 functions
 *
 * Format: IYZWSv2 <base64(apiKey:apiKey&randomKey:randomString&signature:signature)>
 * Where signature = HMAC-SHA256(secretKey, randomString + uri + JSON.stringify(body))
 */
export async function generateAuthorizationHeaderV2(
  apiKey: string,
  secretKey: string,
  uri: string,
  requestBody: Record<string, any>,
  randomString: string,
): Promise<string> {
  // Create signature data: randomString + uri + JSON.stringify(body)
  const signatureData = randomString + uri + JSON.stringify(requestBody);

  // Generate HMAC-SHA256 signature
  const signature = await hmacSha256(secretKey, signatureData);

  // Build authorization params
  const authorizationParams = [
    `apiKey:${apiKey}`,
    `randomKey:${randomString}`,
    `signature:${signature}`,
  ];

  // Base64 encode
  const base64Auth = btoa(authorizationParams.join("&"));

  return `IYZWSv2 ${base64Auth}`;
}

/**
 * Generate V1 Authorization Header (IYZWS) - Fallback
 * Based on official generateAuthorizationHeader and generateHash functions
 *
 * Format: IYZWS apiKey:base64(SHA1(apiKey + randomString + secretKey + pkiString))
 */
export async function generateAuthorizationHeaderV1(
  apiKey: string,
  secretKey: string,
  pkiString: string,
  randomString: string,
): Promise<string> {
  // Create hash input: apiKey + randomString + secretKey + pkiString
  const hashInput = apiKey + randomString + secretKey + pkiString;

  // Generate SHA-1 hash
  const hashBuffer = await sha1(hashInput);
  const hashBase64 = arrayBufferToBase64(hashBuffer);

  return `IYZWS ${apiKey}:${hashBase64}`;
}

/**
 * Generate PKI string from request body (for V1 fallback)
 * Converts object to iyzico PKI format: [key=value,key=value,...]
 */
export function generatePkiString(data: Record<string, any>): string {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }
    if (Array.isArray(value)) {
      const items = value.map((item) => {
        if (typeof item === "object") {
          return generatePkiString(item);
        }
        return String(item);
      });
      return `[${items.join(", ")}]`;
    }
    if (typeof value === "object") {
      return generatePkiString(value);
    }
    return String(value);
  };

  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== "") {
      parts.push(`${key}=${formatValue(value)}`);
    }
  }

  return `[${parts.join(",")}]`;
}
