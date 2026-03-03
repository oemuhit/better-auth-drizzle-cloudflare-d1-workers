import { eq, and, count } from "drizzle-orm";
import { type H3Event } from "h3";
import { useDb } from "./db";
import { coupon, couponUsage, order } from "../db/schema";

export interface ValidationResult {
  valid: boolean;
  coupon?: any;
  error?: string;
  discountAmount?: number;
}

export async function validateCoupon(
  event: H3Event,
  code: string,
  userId: string,
  subtotal: number
): Promise<ValidationResult> {
  const db = useDb(event);

  const existingCoupon = await db.query.coupon.findFirst({
    where: eq(coupon.code, code.toUpperCase()),
  });

  if (!existingCoupon) {
    return { valid: false, error: "Kupon kodu geçersiz." };
  }

  if (!existingCoupon.isActive) {
    return { valid: false, error: "Bu kupon şu anda aktif değil." };
  }

  const now = new Date();
  if (existingCoupon.startDate && new Date(existingCoupon.startDate) > now) {
    return { valid: false, error: "Bu kupon henüz kullanıma açılmadı." };
  }

  if (existingCoupon.endDate && new Date(existingCoupon.endDate) < now) {
    return { valid: false, error: "Bu kuponun süresi dolmuş." };
  }

  if (existingCoupon.minPurchaseAmount && subtotal < existingCoupon.minPurchaseAmount) {
    return {
      valid: false,
      error: `Bu kuponu kullanabilmek için minimum sepet tutarı ${existingCoupon.minPurchaseAmount} TL olmalıdır.`,
    };
  }

  // Check total usage limit
  if (existingCoupon.usageLimitTotal) {
    const totalUsages = await db
      .select({ count: count() })
      .from(couponUsage)
      .where(eq(couponUsage.couponId, existingCoupon.id));

    if (totalUsages[0].count >= existingCoupon.usageLimitTotal) {
      return { valid: false, error: "Bu kuponun kullanım limiti dolmuştur." };
    }
  }

  // Check per user usage limit
  if (existingCoupon.usageLimitPerUser) {
    const userUsages = await db
      .select({ count: count() })
      .from(couponUsage)
      .where(
        and(
          eq(couponUsage.couponId, existingCoupon.id),
          eq(couponUsage.userId, userId)
        )
      );

    if (userUsages[0].count >= existingCoupon.usageLimitPerUser) {
      return { valid: false, error: "Bu kuponu daha önce kullandınız." };
    }
  }

  // Check First Purchase Only or New User Only
  if (existingCoupon.isFirstPurchaseOnly || existingCoupon.isNewUserOnly) {
    const userOrders = await db
      .select({ count: count() })
      .from(order)
      .where(eq(order.userId, userId));

    if (userOrders[0].count > 0) {
      const msg = existingCoupon.isFirstPurchaseOnly 
        ? "Bu kupon sadece ilk alışverişe özeldir." 
        : "Bu kupon sadece yeni üyelere özeldir.";
      return { valid: false, error: msg };
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (existingCoupon.discountType === "percentage") {
    discountAmount = subtotal * (existingCoupon.discountValue / 100);
  } else {
    discountAmount = existingCoupon.discountValue;
  }

  // Discount cannot exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    valid: true,
    coupon: existingCoupon,
    discountAmount,
  };
}
