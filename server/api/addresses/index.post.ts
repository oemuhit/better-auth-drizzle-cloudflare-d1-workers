import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { customerAddress } from "../../db/schema";
import { serverAuth } from "../../utils/auth";
import { addressSchema } from "../../utils/validation";

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

  const body = await readBody(event);
  const result = addressSchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Geçersiz veri",
      data: result.error.format(),
    });
  }

  try {
    const userId = session.user.id;

    // If this is set as default, unset other defaults
    if (result.data.isDefault) {
      await db
        .update(customerAddress)
        .set({ isDefault: false })
        .where(eq(customerAddress.userId, userId));
    }

    const [newAddress] = await db
      .insert(customerAddress)
      .values({
        ...result.data,
        userId,
      })
      .returning();

    return {
      success: true,
      data: newAddress,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create address",
      data: error.message,
    });
  }
});
