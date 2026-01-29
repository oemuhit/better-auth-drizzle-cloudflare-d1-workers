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
  const body = await readBody(event);

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

    // If this is set as default, unset other defaults
    if (body.isDefault && !existing.isDefault) {
      await db
        .update(customerAddress)
        .set({ isDefault: false })
        .where(eq(customerAddress.userId, session.user.id));
    }

    // Prepare update data
    const updateData: Partial<typeof customerAddress.$inferInsert> = {};

    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.addressLine1 !== undefined)
      updateData.addressLine1 = body.addressLine1;
    if (body.addressLine2 !== undefined)
      updateData.addressLine2 = body.addressLine2;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
    if (body.countryCode !== undefined)
      updateData.countryCode = body.countryCode;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.isShipping !== undefined) updateData.isShipping = body.isShipping;
    if (body.isBilling !== undefined) updateData.isBilling = body.isBilling;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;

    const [updated] = await db
      .update(customerAddress)
      .set(updateData)
      .where(eq(customerAddress.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update address",
      data: error.message,
    });
  }
});
