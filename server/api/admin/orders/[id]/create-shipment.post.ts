import { eq } from "drizzle-orm";
import { useDb } from "../../../../utils/db";
import { order } from "../../../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";
import { createOrderShipment } from "../../../../utils/geliver";

/**
 * POST /api/admin/orders/:id/create-shipment
 *
 * Manually triggers Geliver cargo shipment creation for an existing order.
 * Useful if the automatic creation failed at payment time.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const db = useDb(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Order ID is required" });
  }

  const foundOrder = await db.query.order.findFirst({
    where: eq(order.id, id),
  });

  if (!foundOrder) {
    throw createError({ statusCode: 404, statusMessage: "Order not found" });
  }

  if (foundOrder.paymentStatus !== "paid") {
    throw createError({
      statusCode: 400,
      statusMessage: "Kargo yalnızca ödemesi onaylanan siparişler için oluşturulabilir.",
    });
  }

  const config = useRuntimeConfig(event);
  const geliverToken = (config.geliverToken as string) || "";
  const geliverSenderId = (config.geliverSenderId as string) || "";

  if (!geliverToken || !geliverSenderId) {
    throw createError({
      statusCode: 500,
      statusMessage: "Geliver yapılandırması eksik. GELIVER_TOKEN ve GELIVER_SENDER_ID ayarlanmalı.",
    });
  }

  const snap = foundOrder.shippingAddressSnapshot as any;
  const recipientName =
    snap?.firstName && snap?.lastName
      ? `${snap.firstName} ${snap.lastName}`
      : snap?.name || foundOrder.userId;
  const recipientPhone = "+90" + snap?.phone || "";

  if (!recipientPhone) {
    throw createError({
      statusCode: 400,
      statusMessage: "Sipariş adresinde telefon numarası bulunamadı.",
    });
  }

  try {
    const shipmentResult = await createOrderShipment({

      token: geliverToken,
      senderAddressId: geliverSenderId,
      recipient: {
        name: recipientName,
        phone: recipientPhone,
        address1: snap?.addressLine1 || "",
        cityName: snap?.city || "",
        cityCode: snap?.cityCode || "34",
        districtName: snap?.district || "",
        zip: snap?.postalCode,
      },
      order: {
        orderNumber: foundOrder.orderNumber,
        totalAmount: foundOrder.total,
        currency: "TRY",
      },
      test: false,
      storeUrl: (config.geliverStoreUrl as string) || undefined,
    });
console.log(shipmentResult)
    // Update order with tracking info
    const existingNotes = foundOrder.notes || "";
    const additionalNotes = [
      shipmentResult.trackingNumber
        ? `Kargo Takip No: ${shipmentResult.trackingNumber}`
        : null,
      shipmentResult.labelUrl ? `Etiket URL: ${shipmentResult.labelUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await db
      .update(order)
      .set({
        geliverShipmentId: shipmentResult.shipmentId,
        trackingNumber: shipmentResult.trackingNumber ?? null,
        trackingUrl: shipmentResult.trackingUrl ?? null,
        barcode: shipmentResult.barcode ?? null,
        labelUrl: shipmentResult.labelUrl ?? null,
        notes: additionalNotes
          ? `${existingNotes}\n${additionalNotes}`
          : existingNotes,
        fulfillmentStatus: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(order.id, foundOrder.id));

    return {
      success: true,
      data: shipmentResult,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `Geliver kargo oluşturma hatası: ${error?.message || "Bilinmeyen hata"}`,
    });
  }
});
