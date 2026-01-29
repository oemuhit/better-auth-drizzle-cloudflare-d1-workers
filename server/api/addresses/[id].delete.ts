import { eq, and } from "drizzle-orm";
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

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Address ID is required",
    });
  }

  try {
    // Check if address belongs to user
    const existing = await db.query.customerAddress.findFirst({
      where: and(
        eq(customerAddress.id, id),
        eq(customerAddress.userId, session.user.id),
      ),
    });

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Address not found",
      });
    }

    await db.delete(customerAddress).where(eq(customerAddress.id, id));

    return {
      success: true,
      message: "Address deleted successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    // Check for foreign key constraint (orders reference)
    if (error.message?.includes("FOREIGN KEY constraint failed")) {
      throw createError({
        statusCode: 409,
        statusMessage: "Cannot delete address that is used in orders",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete address",
      data: error.message,
    });
  }
});
