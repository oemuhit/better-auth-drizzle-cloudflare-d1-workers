import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { serverAuth } from "../../utils/auth";
import { customerAddress } from "../../db/schema";
import { addressSchema } from "../../utils/validation";

export default defineEventHandler(async (event) => {
    const db = useDb(event);
    const auth = serverAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Oturum açmanız gerekiyor",
        });
    }

    const body = await readBody(event);
    console.log(body)
    const result = addressSchema.safeParse(body);
console.warn(result)
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: "Geçersiz veri",
            data: result.error.format(),
        });
    }

    const userId = session.user.id;

    // Handle isDefault logic (unset other default if this is default)
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
});
