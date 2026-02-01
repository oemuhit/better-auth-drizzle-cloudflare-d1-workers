import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { serverAuth } from "../../utils/auth";
import { user } from "../../db/schema/auth-schema";
import { z } from "zod";

const updateProfileSchema = z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
});

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
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: result.error.errors[0].message,
        });
    }

    const userId = session.user.id;

    await db
        .update(user)
        .set({
            name: result.data.name,
            updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

    return {
        success: true,
        message: "Profil güncellendi",
    };
});
