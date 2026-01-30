import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { wishlist } from "../../db/schema";
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

  const productId = getRouterParam(event, "productId");

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  // Delete from wishlist
  await db
    .delete(wishlist)
    .where(
      and(
        eq(wishlist.userId, session.user.id),
        eq(wishlist.productId, productId),
      ),
    );

  return {
    success: true,
    message: "Removed from wishlist",
  };
});
