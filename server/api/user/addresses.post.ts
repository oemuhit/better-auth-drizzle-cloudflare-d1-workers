import { eq, and } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { serverAuth } from "../../utils/auth";
import { customerAddress } from "../../db/schema";
import { z } from "zod";

const addressSchema = z.object({
    firstName: z.string().min(1, "İsim gerekli"),
    lastName: z.string().min(1, "Soyisim gerekli"),
    addressLine1: z.string().min(5, "Adres çok kısa"),
    addressLine2: z.string().optional(),
    city: z.string().min(2, "Şehir gerekli"),
    state: z.string().optional(),
    postalCode: z.string().min(5, "Posta kodu gerekli"),
    phone: z.string().min(10, "Telefon numarası geçerli değil"),
    isShipping: z.boolean().default(true),
    isBilling: z.boolean().default(true),
    isDefault: z.boolean().default(false),
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
    const result = addressSchema.safeParse(body);

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
