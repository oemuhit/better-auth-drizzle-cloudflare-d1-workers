import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import {
  wishlist,
  product,
  productImage,
  productVariant,
} from "../../db/schema";
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

  // Get user's wishlist with product details
  const wishlistItems = await db.query.wishlist.findMany({
    where: eq(wishlist.userId, session.user.id),
    with: {
      product: {
        with: {
          images: true,
          variants: true,
        },
      },
    },
    orderBy: (wishlist, { desc }) => [desc(wishlist.createdAt)],
  });

  // Transform data
  const items = wishlistItems.map((item) => {
    const prices = item.product.variants?.map((v) => v.price) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    return {
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        thumbnail: item.product.thumbnail,
        status: item.product.status,
        price: minPrice,
        images: item.product.images,
      },
    };
  });

  return {
    data: items,
    total: items.length,
  };
});
