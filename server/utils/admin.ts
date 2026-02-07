import { serverAuth } from "./auth";

/**
 * Returns true if the current user has the 'admin' role. Does not throw.
 */
export const isAdmin = async (event: any): Promise<boolean> => {
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });
  return session?.user?.role === "admin";
};

/**
 * Validates that the current user has the 'admin' role.
 * Throws a 403 Forbidden error if not authorized.
 */
export const requireAdmin = async (event: any) => {
  const auth = serverAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Admin access required",
    });
  }

  return session;
};
