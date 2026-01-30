import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { wishlist } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const auth = serverAuth(event);

  // Check authentication
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    return {
      data: [],
    };
  }

  // Get all product IDs in user's wishlist
  const wishlistItems = await db
    .select({ productId: wishlist.productId })
    .from(wishlist)
    .where(eq(wishlist.userId, session.user.id));

  return {
    data: wishlistItems.map((item) => item.productId),
  };
});
