import { eq, like, and, or, asc, desc, sql, inArray } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { product, productVariant } from "../../db/schema";
import { serverAuth } from "../../utils/auth";

/** Mağazada listelenen ürün durumları (active, backordered, out_of_stock) */
const VISIBLE_IN_STORE_STATUSES = ["active", "backordered", "out_of_stock"] as const;

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const query = getQuery(event);
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });
  const isAdmin = session?.user?.role === "admin";
  const includeAll = isAdmin && query.includeAll === "true";

  // Pagination
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
  const offset = (page - 1) * limit;

  // Filters
  const categoryId = query.categoryId as string | undefined;
  const status = query.status as string | undefined;
  const search = query.search as string | undefined;
  const sortBy = (query.sortBy as string) || "createdAt";
  const sortOrder = (query.sortOrder as string) || "desc";

  try {
    // Build where conditions
    const conditions = [];

    // Admin + includeAll: tüm durumlar (taslak dahil). Değilse sadece mağazada görünenler.
    if (!includeAll) {
      conditions.push(inArray(product.status, [...VISIBLE_IN_STORE_STATUSES]));
    } else if (status) {
      conditions.push(eq(product.status, status as any));
    }

    if (categoryId) {
      conditions.push(eq(product.categoryId, categoryId));
    }

    if (search) {
      conditions.push(
        or(
          like(product.title, `%${search}%`),
          like(product.description, `%${search}%`),
        ),
      );
    }

    // Determine sort column
    let sortColumn: any = product.createdAt;
    if (sortBy === "price") {
      sortColumn = product.basePrice;
    } else if (sortBy === "title") {
      sortColumn = product.title;
    } else if (sortBy in product) {
      sortColumn = product[sortBy as keyof typeof product];
    }

    // Get products with relations
    const products = await db.query.product.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [
        sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn),
      ],
      limit,
      offset,
      with: {
        category: true,
        variants: {
          where: eq(productVariant.isActive, true),
          limit: 5,
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.sort)],
          limit: 3,
        },
      },
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(product)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch products",
      data: error.message,
    });
  }
});
