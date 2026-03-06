import { eq, and, lt, sql, isNull } from "drizzle-orm";
import { H3Event } from "h3";
import { useDb } from "./db";
import { stockReservation, productVariant, product } from "../db/schema";

const RESERVATION_TTL_MINUTES = 15;

interface ReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

/**
 * Reserve stock for a checkout session.
 * Returns success if stock is available and reserved.
 */
export async function reserveStock(
  event: H3Event | null,
  orderId: string,
  variantId: string | null,
  quantity: number,
  productId?: string,
  tx?: any
): Promise<ReservationResult> {
  const db = tx || useDb(event as H3Event);
  const expiresAt = Math.floor(Date.now() / 1000) + RESERVATION_TTL_MINUTES * 60;

  // Normalize IDs - ensure empty strings are treated as null
  const vId = (variantId && variantId.trim() !== "") ? variantId : null;
  const pId = (productId && productId.trim() !== "") ? productId : null;

  // First, clean up expired reservations
  await db
    .delete(stockReservation)
    .where(
      and(
        vId ? eq(stockReservation.productVariantId, vId) : eq(stockReservation.productId, pId!),
        lt(stockReservation.expiresAt, Math.floor(Date.now() / 1000)),
        eq(stockReservation.confirmed, false)
      )
    );

  let currentStock = 0;
  if (vId) {
    const variant = await db.query.productVariant.findFirst({
      where: eq(productVariant.id, vId),
    });
    if (!variant) return { success: false, error: "Ürün varyantı bulunamadı" };
    currentStock = variant.stockQuantity;
  } else if (pId) {
    const prod = await db.query.product.findFirst({
      where: eq(product.id, pId),
    });
    if (!prod) return { success: false, error: "Ürün bulunamadı" };
    currentStock = prod.stockQuantity;
  } else {
    return { success: false, error: "Product ID or Variant ID required" };
  }

  // Calculate reserved quantity
  const reservedResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${stockReservation.quantity}), 0)` })
    .from(stockReservation)
    .where(
      and(
        vId ? eq(stockReservation.productVariantId, vId) : eq(stockReservation.productId, pId!),
        eq(stockReservation.confirmed, false),
        sql`${stockReservation.expiresAt} > ${Math.floor(Date.now() / 1000)}`
      )
    );

  const reservedQuantity = reservedResult[0]?.total || 0;
  const availableStock = currentStock - reservedQuantity;

  if (availableStock < quantity) {
    return { 
      success: false, 
      error: `Yeterli stok yok. Mevcut: ${availableStock}, İstenen: ${quantity}` 
    };
  }

  // Create reservation
  const [reservation] = await db
    .insert(stockReservation)
    .values({
      orderId,
      productVariantId: vId,
      productId: vId ? null : pId,
      quantity,
      expiresAt,
    })
    .returning();

  return { success: true, reservationId: reservation.id };
}

/**
 * Confirm a reservation after successful payment.
 * This decrements stock and marks reservation as confirmed.
 */
export async function confirmReservation(
  event: H3Event,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const db = useDb(event);

  // Find all reservations for this order
  const reservations = await db.query.stockReservation.findMany({
    where: and(
      eq(stockReservation.orderId, orderId),
      eq(stockReservation.confirmed, false)
    ),
  });

  if (reservations.length === 0) {
    return { success: true };
  }

  for (const reservation of reservations) {
    if (reservation.productVariantId) {
      await db
        .update(productVariant)
        .set({
          stockQuantity: sql`MAX(0, ${productVariant.stockQuantity} - ${reservation.quantity})`,
        })
        .where(eq(productVariant.id, reservation.productVariantId));
    } else if (reservation.productId) {
      await db
        .update(product)
        .set({
          stockQuantity: sql`MAX(0, ${product.stockQuantity} - ${reservation.quantity})`,
        })
        .where(eq(product.id, reservation.productId));
    }

    // Mark as confirmed
    await db
      .update(stockReservation)
      .set({ confirmed: true, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(stockReservation.id, reservation.id));
  }

  // Invalidate product cache so pages reflect new stock levels
  const { invalidateProductCache } = await import("./cacheInvalidation");
  await invalidateProductCache();

  return { success: true };
}

/**
 * Release a reservation
 */
export async function releaseReservation(
  event: H3Event | null,
  orderId: string,
  tx?: any
): Promise<void> {
  const db = tx || useDb(event as H3Event);

  await db
    .delete(stockReservation)
    .where(
      and(
        eq(stockReservation.orderId, orderId),
        eq(stockReservation.confirmed, false)
      )
    );
}

/**
 * Get available stock (considering active reservations).
 */
export async function getAvailableStock(
  event: H3Event,
  id: string,
  isProduct: boolean = false
): Promise<number> {
  const db = useDb(event);
  let currentStock = 0;

  if (isProduct) {
    const prod = await db.query.product.findFirst({
      where: eq(product.id, id),
    });
    if (!prod) return 0;
    currentStock = prod.stockQuantity;
  } else {
    const variant = await db.query.productVariant.findFirst({
      where: eq(productVariant.id, id),
    });
    if (!variant) return 0;
    currentStock = variant.stockQuantity;
  }

  const reservedResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${stockReservation.quantity}), 0)` })
    .from(stockReservation)
    .where(
      and(
        isProduct ? eq(stockReservation.productId, id) : eq(stockReservation.productVariantId, id),
        eq(stockReservation.confirmed, false),
        sql`${stockReservation.expiresAt} > ${Math.floor(Date.now() / 1000)}`
      )
    );

  const reservedQuantity = reservedResult[0]?.total || 0;
  return Math.max(0, currentStock - reservedQuantity);
}
