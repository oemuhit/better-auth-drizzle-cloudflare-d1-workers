import { requireAdmin } from "~~/server/utils/admin";
import { useDb } from "../../../../utils/db";
import { order } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { geliverGetShipment } from "../../../../utils/geliver";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Order ID required" });

  const db = useDb(event);
  const [foundOrder] = await db.select().from(order).where(eq(order.id, id)).limit(1);

  if (!foundOrder) throw createError({ statusCode: 404, message: "Order not found" });
  if (!foundOrder.geliverShipmentId)
    throw createError({ statusCode: 400, message: "Bu siparişe ait Geliver kargo kaydı yok" });

  const config = useRuntimeConfig(event);
  const token: string = (config as any).geliverToken ?? "";
  if (!token) throw createError({ statusCode: 503, message: "Geliver token yapılandırılmamış" });

  try {
    const shipment = await geliverGetShipment(token, foundOrder.geliverShipmentId);
    const s = shipment as any;

    const trackingNumber = s.trackingNumber ?? foundOrder.trackingNumber ?? null;
    const barcode = s.barcode ?? foundOrder.barcode ?? null;
    const trackingUrl = s.trackingURL ?? s.trackingUrl ?? foundOrder.trackingUrl ?? null;
    const labelUrl = s.labelURL ?? s.responsiveLabelURL ?? foundOrder.labelUrl ?? null;

    await db
      .update(order)
      .set({ trackingNumber, barcode, trackingUrl, labelUrl, updatedAt: new Date() })
      .where(eq(order.id, id));

    return {
      success: true,
      data: { trackingNumber, barcode, trackingUrl, labelUrl, statusCode: s.statusCode },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: `Kargo bilgisi güncellenemedi: ${error?.message || error}`,
    });
  }
});
