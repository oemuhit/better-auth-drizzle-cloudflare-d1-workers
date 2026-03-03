import { eq } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { useIyzico, IYZICO } from "../../../utils/iyzico";
import { createOrderShipment } from "../../../utils/geliver";
import {
  cart,
  cartItem,
  order,
  orderItem,
  product,
  productVariant,
} from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const body = await readBody(event);

  // iyzico sends token in the callback
  const { token } = body;

  if (!token) {
    // Redirect to checkout with error
    return sendRedirect(event, "/checkout?error=missing_token");
  }

  try {
    // Retrieve payment result from iyzico
    const iyzipay = useIyzico(event);
    const result = await iyzipay.retrieveCheckoutForm({
      locale: IYZICO.LOCALE.TR,
      token,
    });

    console.log("iyzico callback result:", JSON.stringify(result, null, 2));

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.error("Payment failed:", result);
      return sendRedirect(
        event,
        `/checkout?error=payment_failed&message=${encodeURIComponent(result.errorMessage || "Ödeme başarısız")}`,
      );
    }

    // Payment successful - create the order
    const basketId = result.basketId;
    if (!basketId) {
      return sendRedirect(event, "/checkout?error=missing_basket");
    }

    // Get the existing order
    const existingOrder = await db.query.order.findFirst({
      where: eq(order.id, basketId),
      with: {
        items: true,
      },
    });

    if (!existingOrder) {
      console.error("Order not found for basketId:", basketId);
      return sendRedirect(event, "/checkout?error=order_not_found");
    }

    // Update the order and clear cart sequentially (D1 transaction emulation issue fix)
    // 1. Update order status
    await db
      .update(order)
      .set({
        status: "processing",
        paymentStatus: "paid",
        notes: existingOrder.notes
          ? `${existingOrder.notes}\niyzico Payment ID: ${result.paymentId}`
          : `iyzico Payment ID: ${result.paymentId}`,
        updatedAt: new Date(),
      })
      .where(eq(order.id, existingOrder.id));

    // 2. Confirm stock reservation (D1-based) - decrements stock atomically
    const { confirmReservation } =
      await import("../../../utils/stockReservation");
    const conversationId = result.conversationId;

    if (conversationId) {
      await confirmReservation(event, conversationId);
    }

    // 3. Clear the user's cart (D1 for logged-in, KV for guests)
    const cartId = getCookie(event, "cart_id");
    const guestCartsKv = event.context.cloudflare?.env?.GUEST_CARTS;
    if (guestCartsKv && cartId) {
      await guestCartsKv.delete(`cart:${cartId}`);
    }

    const userCart = await db.query.cart.findFirst({
      where: eq(cart.userId, existingOrder.userId),
    });

    if (userCart) {
      await db.delete(cartItem).where(eq(cartItem.cartId, userCart.id));
    }

    // 4. Create Geliver cargo shipment (non-blocking — failure does NOT cancel the order)
    try {
      const config = useRuntimeConfig(event);
      const geliverToken = (config.geliverToken as string) || "";
      const geliverSenderId = (config.geliverSenderId as string) || "";

      if (!geliverToken || !geliverSenderId) {
        console.warn(
          "[Geliver] GELIVER_TOKEN or GELIVER_SENDER_ID not configured — skipping shipment creation.",
        );
      } else {
        const snap = existingOrder.shippingAddressSnapshot as any;
        const recipientName =
          snap?.firstName && snap?.lastName
            ? `${snap.firstName} ${snap.lastName}`
            : snap?.name || existingOrder.userId;
        const recipientPhone = snap?.phone || "";

        if (!recipientPhone) {
          console.warn(
            "[Geliver] No phone on shippingAddressSnapshot — skipping shipment creation.",
          );
        } else {
          const shipmentResult = await createOrderShipment({
            token: geliverToken,
            senderAddressId: geliverSenderId,
            recipient: {
              name: recipientName,
              phone: recipientPhone.startsWith("+") ? recipientPhone : `+90${recipientPhone}`,
              address1: snap?.addressLine1 || "",
              cityName: snap?.city || "",
              cityCode: snap?.cityCode || "34",
              districtName: snap?.district || "",
              zip: snap?.postalCode,
            },
            order: {
              orderNumber: existingOrder.orderNumber,
              totalAmount: existingOrder.total,
              currency: "TRY",
              items: existingOrder.items.map((i: any) => ({
                title: i.productTitle,
                quantity: i.quantity,
              })),
            },
      test: (config as any).geliverTestMode === "true",
            storeUrl: (config.geliverStoreUrl as string) || undefined,
          });

          console.log(
            "[Geliver] Shipment created:",
            JSON.stringify(shipmentResult),
          );

          // Re-fetch current notes to avoid overwriting iyzico note
          const currentOrder = await db.query.order.findFirst({
            where: eq(order.id, existingOrder.id),
          });
          const existingNotes = currentOrder?.notes || "";
          const additionalNotes = [
            shipmentResult.trackingNumber
              ? `Kargo Takip No: ${shipmentResult.trackingNumber}`
              : null,
            shipmentResult.labelUrl
              ? `Etiket URL: ${shipmentResult.labelUrl}`
              : null,
          ]
            .filter(Boolean)
            .join("\n");


     

          await db
            .update(order)
            .set({
              geliverShipmentId: shipmentResult.shipmentId,
              trackingNumber: shipmentResult.trackingNumber ?? null,
              trackingUrl: shipmentResult.trackingUrl ?? null,
              labelUrl: shipmentResult.labelUrl ?? null,
                  barcode: shipmentResult?.barcode?? null,
    transactionId: shipmentResult.transactionId?? null,
    amountCharged: shipmentResult.amountCharged?? null,
        currency: shipmentResult.currency?? null,


              notes: additionalNotes
                ? `${existingNotes}\n${additionalNotes}`
                : existingNotes,
              updatedAt: new Date(),
            })
            .where(eq(order.id, existingOrder.id));
        }
      }
    } catch (geliverError: any) {
      // Log but do NOT re-throw — payment is already confirmed
      console.error(
        "[Geliver] Shipment creation failed (non-fatal):",
        geliverError?.message || geliverError,
      );
    }

    // Redirect to order confirmation page
    return sendRedirect(event, `/orders/${existingOrder.id}?success=true`);
  } catch (error: any) {
    console.error("Payment callback error:", error);
    return sendRedirect(
      event,
      `/checkout?error=callback_error&message=${encodeURIComponent(error.message || "Bir hata oluştu")}`,
    );
  }
});
