import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { serverAuth } from "../../utils/auth";
import { customerAddress } from "../../db/schema";

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

    const userId = session.user.id;

    // Get user profile (already in session, but could fetch more if needed)
    // Get all user addresses
    const addresses = await db.query.customerAddress.findMany({
        where: eq(customerAddress.userId, userId),
    });

    return {
        success: true,
        data: {
            user: session.user,
            addresses,
        },
    };
});
