/**
 * Cache invalidation helpers for Nitro's built-in caching.
 * Uses `useStorage('cache')` to clear cached handler responses.
 *
 * Cache key pattern: nitro:handlers:<name>:<key>.json
 */

async function clearByPrefix(prefix: string) {
  const storage = useStorage("cache");
  const keys = await storage.getKeys(prefix);
  if (keys.length > 0) {
    await Promise.all(keys.map((k) => storage.removeItem(k)));
  }
}

/** Clear all product list and detail caches */
export async function invalidateProductCache() {
  await Promise.all([
    clearByPrefix("nitro:handlers:products-list"),
    clearByPrefix("nitro:handlers:product-detail"),
  ]);
}

/** Clear all category caches */
export async function invalidateCategoryCache() {
  await clearByPrefix("nitro:handlers:categories");
}

/** Clear all tax-rate caches (routeRules-based) */
export async function invalidateTaxRateCache() {
  await clearByPrefix("nitro:handlers:_api_tax-rates");
}
