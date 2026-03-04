import { eq, inArray } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem, product, productVariant } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    // Guest Cart Logic
    const cartId = getCookie(event, "cart_id");
    const kv = event.context.cloudflare?.env?.GUEST_CARTS;
    
    if (kv && cartId) {
      const guestCartRaw = await kv.get(`cart:${cartId}`);
      if (guestCartRaw) {
        const guestCart = JSON.parse(guestCartRaw);
        
        // Enrich with product data
        const enrichedItems = [];
        let subtotal = 0;
        
        // Fetch all products in a single query to avoid N+1 issue
        const productIds = [...new Set(guestCart.items.map((item: any) => item.productId).filter(Boolean))] as string[];
        const productsData = productIds.length > 0 
          ? await db.query.product.findMany({
              where: inArray(product.id, productIds),
              with: {
                variants: true,
                images: true
              }
            })
          : [];
        
        for (const item of guestCart.items) {
          const productData = productsData.find((p) => p.id === item.productId);
          
          if (productData) {
            const variant = productData.variants.find((v: any) => v.id === item.productVariantId);
            const price = variant?.price ?? productData.basePrice ?? 0;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;
            
            enrichedItems.push({
              ...item,
              price,
              itemTotal,
              product: productData,
              productVariant: variant || null
            });
          }
        }
        
        return {
          success: true,
          data: {
            id: cartId,
            items: enrichedItems,
            subtotal,
            itemCount: enrichedItems.reduce((sum, i) => sum + i.quantity, 0)
          }
        };
      }
    }
    
    return {
      success: true,
      data: { id: "guest", items: [], subtotal: 0, itemCount: 0 }
    };
  }

  try {
    // Find or create cart
    let userCart = await db.query.cart.findFirst({
      where: eq(cart.userId, session.user.id),
      with: {
        items: {
          with: {
            product: {
              with: {
                images: {
                  limit: 1,
                },
              },
            },
            productVariant: true,
          },
        },
      },
    });

    if (!userCart) {
      // Create new cart
      const [newCart] = await db
        .insert(cart)
        .values({ userId: session.user.id })
        .returning();

      userCart = {
        ...newCart,
        items: [],
      };
    }

    // Calculate totals
    const itemsWithTotals = userCart.items.map((item) => {
      const price = item.productVariant?.price ?? item.product?.basePrice ?? 0;
      const compareAtPrice = item.productVariant?.compareAtPrice ?? item.product?.compareAtPrice;
      const itemTotal = price * item.quantity;

      return {
        ...item,
        price,
        compareAtPrice,
        itemTotal,
      };
    });

    const subtotal = itemsWithTotals.reduce(
      (sum, item) => sum + item.itemTotal,
      0,
    );
    const itemCount = itemsWithTotals.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      success: true,
      data: {
        id: userCart.id,
        items: itemsWithTotals,
        subtotal,
        itemCount,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch cart",
      data: error.message,
    });
  }
});
