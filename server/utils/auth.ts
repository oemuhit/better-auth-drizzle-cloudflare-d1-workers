import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema/auth-schema"; // Drizzle şemanız

export const serverAuth = (event: any) => {
  // Cloudflare D1 binding'ini al
  if (!event.context?.cloudflare?.env) {
    throw new Error(
      "Cloudflare context is not available. Make sure you're running in a Cloudflare Workers environment.",
    );
  }
  const DB = event.context.cloudflare.env.nuxtdb;
  if (!DB) {
    throw new Error(
      "D1 database binding 'nuxtdb' is not available. Check your wrangler.jsonc configuration.",
    );
  }
  const db = drizzle(DB, { schema });

  // Get environment variables for OAuth
  const env = event.context.cloudflare.env;

  return betterAuth({
    trustedOrigins: ["http://localhost:3000"],
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,

    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
  });
};
