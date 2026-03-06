/**
 * Safe pricing utilities for Nuxt 3 e-commerce.
 * Prevents JavaScript floating-point errors (e.g., 0.1 + 0.2 = 0.30000000000000004).
 */

/**
 * Rounds a number to exactly 2 decimal places properly.
 * Uses epsilon to handle internal JS float precision issues safely.
 */
export function roundPrice(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates the tax amount extracted from a tax-inclusive price.
 * Formula: taxAmount = price * (taxRate / (100 + taxRate))
 * @param inclusivePrice Total price (KDV dahil)
 * @param taxRatePercentage The tax rate (e.g., 18 for 18%)
 */
export function extractTaxAmount(inclusivePrice: number, taxRatePercentage: number): number {
  if (inclusivePrice <= 0 || taxRatePercentage <= 0) return 0;
  const tax = inclusivePrice * (taxRatePercentage / (100 + taxRatePercentage));
  return roundPrice(tax);
}

/**
 * Calculates the percentage distribution of an item within a total,
 * useful for distributing cart-level discounts to individual items safely.
 */
export function calculateItemDiscount(itemTotal: number, subtotal: number, totalDiscount: number): number {
  if (subtotal <= 0 || totalDiscount <= 0 || itemTotal <= 0) return 0;
  
  const ratio = itemTotal / subtotal;
  const calculatedDiscount = ratio * totalDiscount;
  
  return roundPrice(calculatedDiscount);
}
