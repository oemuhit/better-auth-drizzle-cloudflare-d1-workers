import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { cart, cartItem } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
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
      const price = item.productVariant?.price || 0;
      const compareAtPrice = item.productVariant?.compareAtPrice;
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
