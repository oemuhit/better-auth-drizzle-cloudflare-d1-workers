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

  const body = await readBody(event);

  // Validate required fields
  if (!body.addressLine1 || !body.city || !body.postalCode) {
    throw createError({
      statusCode: 400,
      statusMessage: "Address line 1, city, and postal code are required",
    });
  }

  try {
    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await db
        .update(customerAddress)
        .set({ isDefault: false })
        .where(eq(customerAddress.userId, session.user.id));
    }

    const [newAddress] = await db
      .insert(customerAddress)
      .values({
        userId: session.user.id,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 || null,
        city: body.city,
        state: body.state || null,
        postalCode: body.postalCode,
        countryCode: body.countryCode || "TR",
        phone: body.phone || null,
        isShipping: body.isShipping ?? true,
        isBilling: body.isBilling ?? true,
        isDefault: body.isDefault ?? false,
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
