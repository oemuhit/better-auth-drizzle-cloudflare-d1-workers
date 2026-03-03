import { requireAdmin } from "~~/server/utils/admin";
import { useDb } from "../../../../utils/db";
import { order } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { acceptShipmentOffer } from "../../../../utils/geliver";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Order ID required" });

  const body = await readBody(event);
  const offerId: string = body?.offerId;
  const shipmentIdFromBody: string | undefined = body?.shipmentId;

  if (!offerId) {
    throw createError({ statusCode: 400, message: "offerId is required" });
  }

  const db = useDb(event);
  const [foundOrder] = await db
    .select()
    .from(order)
    .where(eq(order.id, id))
    .limit(1);

  if (!foundOrder)
    throw createError({ statusCode: 404, message: "Order not found" });

  const config = useRuntimeConfig(event);
  const token: string = (config as any).geliverToken ?? "";

  if (!token) {
    throw createError({
      statusCode: 503,
      message: "GELIVER_TOKEN not configured",
    });
  }

  try {
    const result = await acceptShipmentOffer(token, offerId);

    // Persist tracking info to the order
    const existingNotes = foundOrder.notes ? String(foundOrder.notes) : "";
    const trackingNote = result.trackingNumber
      ? `\n[Kargo] ${result.trackingNumber}${result.trackingUrl ? " — " + result.trackingUrl : ""}${result.amountCharged ? ` (${result.amountCharged} ${result.currency ?? "TL"})` : ""}`
      : "";

    await db
      .update(order)
      .set({
        status: "processing",
        fulfillmentStatus: "in_progress",
        geliverShipmentId: shipmentIdFromBody ?? result.shipmentId,
        trackingNumber: result.trackingNumber ?? null,
        barcode: result.barcode ?? null,
        trackingUrl: result.trackingUrl ?? null,
        labelUrl: result.labelUrl ?? null,
        notes: (existingNotes + trackingNote).trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(order.id, id));

    return { success: true, data: result };
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: `Geliver accept offer failed: ${error?.message || error}`,
    });
  }
});
