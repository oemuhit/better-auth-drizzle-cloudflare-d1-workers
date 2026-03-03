import { serverAuth } from "../../utils/auth";
import { validateCoupon } from "../../utils/coupon";

export default defineEventHandler(async (event) => {
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);

  if (!body.code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Coupon code is required",
    });
  }

  const subtotal = body.subtotal || 0;

  const result = await validateCoupon(
    event,
    body.code,
    session.user.id,
    subtotal
  );

  return result;
});
