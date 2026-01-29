import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { customerAddress } from "../../db/schema";
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
    const addresses = await db.query.customerAddress.findMany({
      where: eq(customerAddress.userId, session.user.id),
      orderBy: (addr, { desc }) => [desc(addr.isDefault), desc(addr.createdAt)],
    });

    return {
      success: true,
      data: addresses,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch addresses",
      data: error.message,
    });
  }
});
