import { eq } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { serverAuth } from "../../../utils/auth";
import { customerAddress } from "../../../db/schema";
import { validateCoupon } from "../../../utils/coupon";
import { OrderService } from "../../../services/order.service";
import { PaymentService } from "../../../services/payment.service";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });
  const body = await readBody(event);

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Oturum açmanız gerekiyor" });
  }

  const userId = session.user.id;
  const { shippingAddressId, billingAddressId, notes, couponCode } = body;

  if (!shippingAddressId) {
    throw createError({ statusCode: 400, statusMessage: "Teslimat adresi gerekli" });
  }

  try {
    // 1. Fetch Cart
    const userCart = await OrderService.getCartWithItems(db, userId);

    if (!userCart || !userCart.items || userCart.items.length === 0) {
      throw createError({ statusCode: 400, statusMessage: "Sepet boş" });
    }

    // 2. Fetch Addresses
    const shippingAddr = await db.query.customerAddress.findFirst({
      where: eq(customerAddress.id, shippingAddressId),
    });

    if (!shippingAddr) {
      throw createError({ statusCode: 404, statusMessage: "Teslimat adresi bulunamadı" });
    }

    const billingAddr = billingAddressId
      ? await db.query.customerAddress.findFirst({
          where: eq(customerAddress.id, billingAddressId),
        })
      : shippingAddr;

    if (!billingAddr) {
      throw createError({ statusCode: 404, statusMessage: "Fatura adresi bulunamadı" });
    }

    // 3. Mathematical Calculations (Safe Pricing)
    const totals = OrderService.calculateTotals(userCart.items);
    let discountTotal = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const validation = await validateCoupon(event, couponCode, userId, totals.subtotal);
      if (!validation.valid) {
        throw createError({ statusCode: 400, statusMessage: validation.error });
      }
      appliedCoupon = validation.coupon;
      discountTotal = validation.discountAmount || 0;
    }

    const totalToPay = Math.max(0, totals.subtotal - discountTotal);
    
    // Distribute discount for Iyzico
    const finalItemsData = OrderService.applyDiscountToItems(
      totals.itemsData,
      totals.subtotal,
      discountTotal
    );

    // 4. Create Order & Reserve Stock in a Transaction
    const orderId = await OrderService.createOrUpdatePendingOrder(db, {
      userId,
      shippingAddr,
      billingAddr,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal,
      total: totalToPay,
      notes,
      couponCode: appliedCoupon?.code || null,
      itemsData: finalItemsData,
    });

    // 5. Initialize Payment Gateway via Abstraction Layer
    const paymentResult = await PaymentService.initIyzicoCheckout(event, {
      userId,
      orderId,
      subtotal: totals.subtotal,
      total: totalToPay,
      itemsData: finalItemsData,
      shippingAddr,
      billingAddr,
      userEmail: session.user.email || "test@test.com",
      userName: shippingAddr.firstName || session.user.name || "Müşteri",
    });

    if (!paymentResult.success || !paymentResult.data) {
      throw createError({
        statusCode: 400,
        statusMessage: paymentResult.errorMessage || "Ödeme başlatılamadı",
      });
    }

    // 6. Return standard valid response
    return {
      success: true,
      data: paymentResult.data,
    };

  } catch (error: any) {
    console.error("Payment init abstraction error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Ödeme işlemi başlatılamadı",
      data: error.message,
    });
  }
});
