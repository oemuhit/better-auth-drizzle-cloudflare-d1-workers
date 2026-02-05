import { eq, and } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { serverAuth } from "../../../utils/auth";
import { customerAddress } from "../../../db/schema";
import { addressSchema } from "../../../utils/validation";
const updateAddressSchema = addressSchema.partial();

export default defineEventHandler(async (event) => {
    const db = useDb(event);
    const auth = serverAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    const id = getRouterParam(event, "id");

    if (!session?.user || !id) {
        throw createError({
            statusCode: 401,
            statusMessage: "Geçersiz istek",
        });
    }

    const body = await readBody(event);
    const result = updateAddressSchema.safeParse(body);

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: "Geçersiz veri",
            data: result.error.format(),
        });
    }

    const userId = session.user.id;

    // Handle isDefault logic
    if (result.data.isDefault) {
        await db
            .update(customerAddress)
            .set({ isDefault: false })
            .where(eq(customerAddress.userId, userId));
    }

    const [updatedAddress] = await db
        .update(customerAddress)
        .set({
            ...result.data,
            updatedAt: new Date(),
        })
        .where(and(eq(customerAddress.id, id), eq(customerAddress.userId, userId)))
        .returning();

    if (!updatedAddress) {
        throw createError({
            statusCode: 404,
            statusMessage: "Adres bulunamadı",
        });
    }

    return {
        success: true,
        data: updatedAddress,
    };
});
