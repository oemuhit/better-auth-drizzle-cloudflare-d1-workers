import { requireAdmin } from "~~/server/utils/admin";
import { useDb } from "../../../../utils/db";
import { order } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { geliverCancelShipment } from "../../../../utils/geliver";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Order ID required" });

  const db = useDb(event);
  const [foundOrder] = await db
    .select()
    .from(order)
    .where(eq(order.id, id))
    .limit(1);

  if (!foundOrder)
    throw createError({ statusCode: 404, message: "Order not found" });

  if (!foundOrder.geliverShipmentId) {
    throw createError({
      statusCode: 400,
      message: "Bu siparişe ait bir Geliver kargo kaydı yok",
    });
  }

  const config = useRuntimeConfig(event);
  const token: string = (config as any).geliverToken ?? "";

  if (!token) {
    throw createError({ statusCode: 503, message: "GELIVER_TOKEN not configured" });
  }

  try {
    const result = await geliverCancelShipment(token, foundOrder.geliverShipmentId);

    // Clear shipment fields from the order & add a note
    const existingNotes = foundOrder.notes ? String(foundOrder.notes) : "";
    const cancelNote = `\n[Kargo İptal] Geliver kargo iptali yapıldı (${new Date().toLocaleDateString("tr-TR")})`;

    await db
      .update(order)
      .set({
        status: "cancelled",
        fulfillmentStatus: "open",
        geliverShipmentId: null,
        trackingNumber: null,
        trackingUrl: null,
        labelUrl: null,
        barcode:null,
        transactionId:null,
        amountCharged:null,
        cancelledAt: new Date(),
        notes: (existingNotes + cancelNote).trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(order.id, id));

    return { success: true, data: result };
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: `Kargo iptal edilemedi: ${error?.message || error}`,
    });
  }
});
