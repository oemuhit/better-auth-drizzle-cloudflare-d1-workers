import { eq } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { order } from "../../../db/schema";
import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
    await requireAdmin(event);
    const db = useDb(event);
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Order ID is required",
        });
    }

    try {
        const foundOrder = await db.query.order.findFirst({
            where: eq(order.id, id),
            with: {
                items: {
                    with: {
                        product: true,
                        productVariant: true,
                    },
                },
                user: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!foundOrder) {
            throw createError({
                statusCode: 404,
                statusMessage: "Order not found",
            });
        }

        return {
            success: true,
            data: foundOrder,
        };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: "Failed to fetch order",
            data: error.message,
        });
    }
});
