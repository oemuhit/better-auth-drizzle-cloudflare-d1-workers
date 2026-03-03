import { requireAdmin } from "~~/server/utils/admin";
import { useDb } from "../../../../utils/db";
import { order } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { geliverCreateReturn } from "../../../../utils/geliver";

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
      message:
        "Bu siparişe ait bir Geliver kargo kaydı yok — önce kargo oluşturulmalı",
    });
  }

  const config = useRuntimeConfig(event);
  const token: string = (config as any).geliverToken ?? "";
  const providerServiceCode: string =
    (config as any).geliverReturnProviderCode ?? "GELIVER_STANDART";

  if (!token) {
    throw createError({
      statusCode: 503,
      message: "Geliver credentials not configured",
    });
  }

  // Use customer's shipping address as pickup (sender) address for the return
  const snap = foundOrder.shippingAddressSnapshot as any;
  const senderName =
    snap?.firstName && snap?.lastName
      ? `${snap.firstName} ${snap.lastName}`
      : snap?.name || foundOrder.userId;
  const senderPhone = snap?.phone
    ? snap.phone.startsWith("+") || snap.phone.startsWith("90")
      ? snap.phone
      : `+90${snap.phone}`
    : "";

  if (!senderName || !snap?.addressLine1 || !snap?.cityCode || !snap?.district) {
    throw createError({
      statusCode: 400,
      message:
        "İade için gerekli adres bilgileri eksik (isim, adres, şehir kodu, ilçe).",
    });
  }

  try {
    const returnShipment = await geliverCreateReturn(token, foundOrder.geliverShipmentId, {
      willAccept: true,
      providerServiceCode,
      count: 1,
      senderAddress: {
        name: senderName,
        phone: senderPhone || undefined,
        address1: snap.addressLine1,
        countryCode: "TR",
        cityCode: snap.cityCode || "34",
        districtName: snap.district,
      },
    });

    console.log("[create-return] Geliver raw response:", JSON.stringify(returnShipment, null, 2));

    // willAccept:true → Geliver may return a transaction with nested shipment (like accept-offer does)
    const r = returnShipment as any;
    const s = r.shipment ?? r; // unwrap transaction→shipment if needed

    const returnBarcode =
      s.barcode ?? r.barcode ?? null;
    const returnLabelUrl =
      s.labelURL ?? s.responsiveLabelURL ?? r.labelURL ?? r.responsiveLabelURL ?? null;
    const returnShipmentDbId = s.id ?? r.id ?? null;

    // Append a note to the order about the return
    const existingNotes = foundOrder.notes ? String(foundOrder.notes) : "";
    const returnNote = `\n[İade] Geliver iade kargosu oluşturuldu${
      returnBarcode ? ` — Barkod: ${returnBarcode}` : ""
    } (${new Date().toLocaleDateString("tr-TR")})`;

    await db
      .update(order)
      .set({
        fulfillmentStatus: "on_hold",
        returnShipmentId: returnShipmentDbId,
        returnBarcode,
        returnLabelUrl,
        notes: (existingNotes + returnNote).trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(order.id, id));

    return {
      success: true,
      data: {
        returnShipmentId: returnShipmentDbId,
        barcode: returnBarcode,
        labelUrl: returnLabelUrl,
        statusCode: s.statusCode ?? r.statusCode,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: `İade kargosu oluşturulamadı: ${error?.message || error}`,
    });
  }
});
