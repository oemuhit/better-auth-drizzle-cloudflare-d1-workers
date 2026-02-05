import { eq, and, lt, sql } from "drizzle-orm";
import { H3Event } from "h3";
import { useDb } from "./db";
import { stockReservation, productVariant } from "../db/schema";

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
  event: H3Event,
  orderId: string,
  variantId: string,
  quantity: number
): Promise<ReservationResult> {
  const db = useDb(event);
  const expiresAt = Math.floor(Date.now() / 1000) + RESERVATION_TTL_MINUTES * 60;

  // First, clean up expired reservations for this variant
  await db
    .delete(stockReservation)
    .where(
      and(
        eq(stockReservation.productVariantId, variantId),
        lt(stockReservation.expiresAt, Math.floor(Date.now() / 1000)),
        eq(stockReservation.confirmed, false)
      )
    );

  // Get current variant stock
  const variant = await db.query.productVariant.findFirst({
    where: eq(productVariant.id, variantId),
  });

  if (!variant) {
    return { success: false, error: "Ürün varyantı bulunamadı" };
  }

  // Calculate reserved quantity (excluding confirmed and expired)
  const reservedResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${stockReservation.quantity}), 0)` })
    .from(stockReservation)
    .where(
      and(
        eq(stockReservation.productVariantId, variantId),
        eq(stockReservation.confirmed, false),
        sql`${stockReservation.expiresAt} > ${Math.floor(Date.now() / 1000)}`
      )
    );

  const reservedQuantity = reservedResult[0]?.total || 0;
  const availableStock = (variant.stockQuantity || 0) - reservedQuantity;

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
      productVariantId: variantId,
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
    // No reservations to confirm (might already be confirmed or expired)
    return { success: true };
  }

  // Confirm each reservation and decrement stock
  for (const reservation of reservations) {
    // Decrement stock
    await db
      .update(productVariant)
      .set({
        stockQuantity: sql`MAX(0, ${productVariant.stockQuantity} - ${reservation.quantity})`,
      })
      .where(eq(productVariant.id, reservation.productVariantId));

    // Mark as confirmed
    await db
      .update(stockReservation)
      .set({ confirmed: true, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(stockReservation.id, reservation.id));
  }

  return { success: true };
}

/**
 * Release a reservation (e.g., when payment fails or user cancels).
 */
export async function releaseReservation(
  event: H3Event,
  orderId: string
): Promise<void> {
  const db = useDb(event);

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
 * Get available stock for a variant (considering active reservations).
 */
export async function getAvailableStock(
  event: H3Event,
  variantId: string
): Promise<number> {
  const db = useDb(event);

  const variant = await db.query.productVariant.findFirst({
    where: eq(productVariant.id, variantId),
  });

  if (!variant) return 0;

  const reservedResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${stockReservation.quantity}), 0)` })
    .from(stockReservation)
    .where(
      and(
        eq(stockReservation.productVariantId, variantId),
        eq(stockReservation.confirmed, false),
        sql`${stockReservation.expiresAt} > ${Math.floor(Date.now() / 1000)}`
      )
    );

  const reservedQuantity = reservedResult[0]?.total || 0;
  return Math.max(0, (variant.stockQuantity || 0) - reservedQuantity);
}
