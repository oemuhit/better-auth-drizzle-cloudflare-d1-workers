import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { useDb } from "./db";
import * as schema from "../db/schema";

export const serverAuth = (event: any) => {
  // Check request-scope cache
  if (event.context.auth) {
    return event.context.auth;
  }

  // Prevent recursion
  if (event.context._auth_init) {
    console.error("[Auth] Recursive initialization detected!");
    return event.context._auth_init;
  }

  const db = useDb(event);
  const config = useRuntimeConfig(event);
  const env = event.context.cloudflare?.env;
  const siteUrl = config.public.siteUrl;

  const auth = betterAuth({
    trustedOrigins: ["http://localhost:3000", siteUrl],
    plugins: [
        admin() as any
    ],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification
      }
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env?.GOOGLE_CLIENT_ID || "",
        clientSecret: env?.GOOGLE_CLIENT_SECRET || "",
      },
    },
  });

  event.context.auth = auth;
  event.context._auth_init = auth;
  return auth;
};
