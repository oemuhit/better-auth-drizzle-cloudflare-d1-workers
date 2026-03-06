import { eq, and } from "drizzle-orm";
import { type ExtractTablesWithRelations } from "drizzle-orm";
import { type SQLiteTransaction } from "drizzle-orm/sqlite-core";
import {
  order,
  orderItem,
  cart,
  cartItem,
  product,
  customerAddress,
  type CustomerAddress,
} from "../db/schema";
import { roundPrice, extractTaxAmount, calculateItemDiscount } from "../utils/pricing";
import { ECOMMERCE_CONFIG } from "../utils/constants";
import { reserveStock, releaseReservation } from "../utils/stockReservation";

export class OrderService {
  /**
   * Retrieves an active cart with all its nested relations (products, variants, categories).
   * @param db Drizzle DB instance
   * @param userId ID of the user owning the cart
   */
  static async getCartWithItems(db: any, userId: string) {
    return await db.query.cart.findFirst({
      where: eq(cart.userId, userId),
      with: {
        items: {
          with: {
            product: {
              with: {
                category: true,
              },
            },
            productVariant: true,
          },
        },
      },
    });
  }

  /**
   * Calculates subtotal, tax total and transforms items safely for placing an order.
   * Handles float rounding safely.
   */
  static calculateTotals(cartItems: any[]) {
    let subtotal = 0;
    let taxTotal = 0;
    const itemsData: any[] = [];

    for (const item of cartItems) {
      // 1. Get base price
      const rawItemPrice = item.productVariant?.price ?? item.product.basePrice ?? 0;
      const itemPrice = roundPrice(rawItemPrice);
      
      // 2. Calculate item totals safely
      const itemTotal = roundPrice(itemPrice * item.quantity);
      subtotal = roundPrice(subtotal + itemTotal);

      // 3. Tax calculations
      const taxRatePercent = item.product.taxRate?.rate ?? ECOMMERCE_CONFIG.DEFAULT_TAX_RATE;
      const itemTax = extractTaxAmount(itemTotal, taxRatePercent);
      taxTotal = roundPrice(taxTotal + itemTax);

      // 4. Variant Info Formatting
      let variantInfo: string | null = null;
      if (item.productVariant) {
        const parts: string[] = [];
        if (item.productVariant.attributes?.color) parts.push(`Renk: ${item.productVariant.attributes.color}`);
        if (item.productVariant.attributes?.size) parts.push(`Beden: ${item.productVariant.attributes.size}`);
        if (item.productVariant.sku) parts.push(`SKU: ${item.productVariant.sku}`);
        if (parts.length > 0) variantInfo = parts.join(", ");
      }

      itemsData.push({
        id: item.productVariant?.id || item.product.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        name: item.product.title,
        category: item.product.category?.title || "Genel",
        price: itemPrice, // unit price
        total: itemTotal, // total line price
        quantity: item.quantity,
        variantInfo,
      });
    }

    return { subtotal, taxTotal, itemsData };
  }

  /**
   * Distributes total discount among cart items safely to avoid rounding discrepancies.
   * Modifies the `itemsData` array in-place to include `discountedTotal`.
   */
  static applyDiscountToItems(itemsData: any[], subtotal: number, discountTotal: number) {
    let remainingDiscount = discountTotal;

    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];
      let itemDiscount = 0;

      if (discountTotal > 0 && subtotal > 0) {
        if (i === itemsData.length - 1) {
          // Give all remaining discount to the last item to fix any fractional dust
          itemDiscount = remainingDiscount;
        } else {
          itemDiscount = calculateItemDiscount(item.total, subtotal, discountTotal);
          remainingDiscount = roundPrice(remainingDiscount - itemDiscount);
        }
      }

      item.discountedTotal = Math.max(0, roundPrice(item.total - itemDiscount));
      item.itemDiscountAmount = itemDiscount;
    }

    return itemsData;
  }

  /**
   * Safe Order Generation Process wrapped in a Database Transaction.
   * If any step fails (e.g. D1 disconnect or foreign key issue), the entire order + items are rolled back.
   */
  static async createOrUpdatePendingOrder(
    db: any,
    params: {
      userId: string;
      shippingAddr: CustomerAddress;
      billingAddr: CustomerAddress;
      subtotal: number;
      taxTotal: number;
      discountTotal: number;
      total: number;
      notes?: string;
      couponCode?: string | null;
      itemsData: any[];
    }
  ) {
    // We run the entire order prep via a pure serialized transaction block.
    // Drizzle currently supports top-level db.transaction
    return await db.transaction(async (tx: any) => {
      // 1. Check for existing pending order
      const existingPendingOrder = await tx.query.order.findFirst({
        where: and(
          eq(order.userId, params.userId),
          eq(order.status, "pending"),
          eq(order.paymentStatus, "not_paid")
        ),
      });

      let activeOrderId: string;

      if (existingPendingOrder) {
        // 2A. Update the existing order
        await tx
          .update(order)
          .set({
            shippingAddressSnapshot: params.shippingAddr,
            billingAddressSnapshot: params.billingAddr,
            subtotal: params.subtotal,
            taxTotal: params.taxTotal,
            shippingTotal: 0,
            discountTotal: params.discountTotal,
            total: params.total,
            couponCode: params.couponCode,
            notes: params.notes,
            updatedAt: new Date(),
          })
          .where(eq(order.id, existingPendingOrder.id));
        
        // Wipe old items clean
        await tx.delete(orderItem).where(eq(orderItem.orderId, existingPendingOrder.id));
        
        // Also wipe any old unconfirmed stock reservations attached to this pending order
        // Otherwise a user retrying a failed payment might get blocked by their own 15-minute stock hold
        await releaseReservation(null, existingPendingOrder.id, tx);
        
        activeOrderId = existingPendingOrder.id;
      } else {
        // 2B. Create new order
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const [newOrder] = await tx
          .insert(order)
          .values({
            orderNumber,
            userId: params.userId,
            status: "pending",
            paymentStatus: "not_paid",
            shippingAddressSnapshot: params.shippingAddr,
            billingAddressSnapshot: params.billingAddr,
            subtotal: params.subtotal,
            taxTotal: params.taxTotal,
            shippingTotal: 0,
            discountTotal: params.discountTotal,
            total: params.total,
            couponCode: params.couponCode,
            notes: params.notes,
          })
          .returning();
          
        activeOrderId = newOrder.id;
      }

      // 3. Create fresh order items for the designated order
      const orderItemsToInsert = params.itemsData.map(item => ({
        orderId: activeOrderId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productTitle: item.name,
        variantInfo: item.variantInfo,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.total, 
        total: item.discountedTotal ?? item.total, // what they actually paid for this line
      }));

      if (orderItemsToInsert.length > 0) {
        await tx.insert(orderItem).values(orderItemsToInsert);
        
        // --- STOCK RESERVATION (Transactional) ---
        // Ties into the loop to safely abort and rollback the entire order/items 
        // if even a single item hits an out-of-stock wall.
        for (const item of params.itemsData) {
           const resResult = await reserveStock(
             null, 
             activeOrderId,
             item.productVariantId,
             item.quantity,
             item.productId,
             tx
           );
           
           if (!resResult.success) {
             throw createError({ 
               statusCode: 400, 
               statusMessage: `${item.name} için stok yetersiz: ${resResult.error}` 
             });
           }
        }
      }

      // 4. Return the ID so the caller can pass it to Payment Gateway
      return activeOrderId;
    });
  }
}
