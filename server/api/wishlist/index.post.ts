import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { wishlist, product } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);

  // Check authentication
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { productId } = body;

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  // Check if product exists
  const productExists = await db.query.product.findFirst({
    where: eq(product.id, productId),
  });

  if (!productExists) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  // Check if already in wishlist
  const existing = await db.query.wishlist.findFirst({
    where: and(
      eq(wishlist.userId, session.user.id),
      eq(wishlist.productId, productId),
    ),
  });

  if (existing) {
    return {
      success: true,
      message: "Already in wishlist",
      data: existing,
    };
  }

  // Add to wishlist
  const newItem = await db
    .insert(wishlist)
    .values({
      userId: session.user.id,
      productId,
    })
    .returning();

  return {
    success: true,
    message: "Added to wishlist",
    data: newItem[0],
  };
});
