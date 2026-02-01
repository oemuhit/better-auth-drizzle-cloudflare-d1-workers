import { eq, and } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { serverAuth } from "../../../utils/auth";
import { customerAddress } from "../../../db/schema";

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

    const userId = session.user.id;

    const result = await db
        .delete(customerAddress)
        .where(and(eq(customerAddress.id, id), eq(customerAddress.userId, userId)))
        .returning();

    if (result.length === 0) {
        throw createError({
            statusCode: 404,
            statusMessage: "Adres bulunamadı",
        });
    }

    return {
        success: true,
        message: "Adres silindi",
    };
});
