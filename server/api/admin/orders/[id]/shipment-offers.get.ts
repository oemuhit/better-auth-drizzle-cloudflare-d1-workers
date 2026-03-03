import { requireAdmin } from "~~/server/utils/admin";
import { useDb } from "../../../../utils/db";
import { order, orderItem } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { createShipmentAndGetOffers } from "../../../../utils/geliver";

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

  // Also fetch order items for the shipment manifest
  const orderItems = await db
    .select({ title: orderItem.productTitle, quantity: orderItem.quantity })
    .from(orderItem)
    .where(eq(orderItem.orderId, id));

  if (!foundOrder)
    throw createError({ statusCode: 404, message: "Order not found" });

  if (foundOrder.paymentStatus !== "paid")
    throw createError({
      statusCode: 400,
      message: "Order must be paid before creating a shipment",
    });

  const config = useRuntimeConfig(event);
  const token: string = (config as any).geliverToken ?? "";
  const senderAddressId: string = (config as any).geliverSenderId ?? "";

  if (!token || !senderAddressId) {
    throw createError({
      statusCode: 503,
      message:
        "Geliver credentials not configured. Set GELIVER_TOKEN and GELIVER_SENDER_ID.",
    });
  }

  const snap = foundOrder.shippingAddressSnapshot as any;
  const recipientName =
    snap?.firstName && snap?.lastName
      ? `${snap.firstName} ${snap.lastName}`
      : snap?.name || foundOrder.userId;
  const recipientPhone = "+90" + (snap?.phone || "");

  if (!recipientPhone || recipientPhone === "+90") {
    throw createError({
      statusCode: 400,
      message: "Recipient phone number is missing in shipping address",
    });
  }

  console.log("Geliver Test Mode Config:", (config as any).geliverTestMode, typeof (config as any).geliverTestMode);
  console.log("Raw Process Env GELIVER_TEST_MODE:", process.env.GELIVER_TEST_MODE);
  console.log("Raw Process Env NUXT_GELIVER_TEST_MODE:", (process.env as any).NUXT_GELIVER_TEST_MODE);
  console.log("All Process Env Keys:", Object.keys(process.env).filter(k => k.includes("GELIVER")));

  try {
    const result = await createShipmentAndGetOffers({
      token,
      senderAddressId,
      recipient: {
        name: String(recipientName),
        phone: recipientPhone,
        address1: snap?.addressLine1 || "",
        cityName: snap?.city || "",
        cityCode: snap?.cityCode || "34",
        districtName: snap?.district || "",
        zip: snap?.postalCode,
      },
      order: {
        orderNumber: String(foundOrder.orderNumber),
        totalAmount: Math.round(Number(foundOrder.total)),
        currency: "TL",
        items: orderItems.length > 0
          ? orderItems.map(i => ({ title: i.title, quantity: i.quantity }))
          : [{ title: "Sipariş ürünleri", quantity: 1 }],
      },
      test: String((config as any).geliverTestMode) === "true",
      storeUrl: (config as any).geliverStoreUrl ?? "https://geliver.io",
    });

    return { success: true, data: result };
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: `Geliver offer fetch failed: ${error?.message || error}`,
    });
  }
});
