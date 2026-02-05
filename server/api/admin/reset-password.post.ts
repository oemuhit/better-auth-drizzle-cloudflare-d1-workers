import { eq } from "drizzle-orm";
import { useDb } from "../../utils/db";
import { user } from "../../db/schema";

// DELETE THIS ENDPOINT AFTER USE!
// Bu endpoint kullanıcıyı siler, sonra /sign-up sayfasından yeniden kayıt olabilirsiniz.
//
// Kullanım:
// curl -X POST http://localhost:3000/api/admin/reset-password \
//   -H "Content-Type: application/json" \
//   -d '{"email":"admin@example.com","secretKey":"TEMP_RESET_KEY_12345"}'

import { requireAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb(event);
  const body = await readBody(event);

  const { email } = body;

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: "Email required" });
  }

  try {
    // Find user
    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!foundUser) {
      throw createError({ statusCode: 404, statusMessage: "User not found" });
    }

    // Delete user (cascades to account and session)
    await db.delete(user).where(eq(user.id, foundUser.id));

    return {
      success: true,
      message: `User ${email} deleted. Please sign up again at /sign-up`,
      nextStep:
        "Go to /sign-up and register with the same email and your desired password",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete user",
      data: error.message,
    });
  }
});
