import { drizzle } from "drizzle-orm/d1";
import type { H3Event } from "h3";
import * as schema from "../db/schema/index";

export type D1DrizzleDB = ReturnType<typeof createDrizzle>;

function createDrizzle(event: H3Event) {
  if (!event.context?.cloudflare?.env) {
    throw new Error(
      "Cloudflare context is not available. Make sure you're running in a Cloudflare Workers environment."
    );
  }
  const db = event.context.cloudflare.env.nuxtdb;
  if (!db) {
    throw new Error(
      "D1 database binding 'nuxtdb' is not available. Check your wrangler.jsonc configuration."
    );
  }
  return drizzle(db, { schema });
}

export function useDb(event: H3Event): D1DrizzleDB {
  // request-scope cache
  if (!event.context.db) {
    event.context.db = createDrizzle(event);
  }

  return event.context.db;
}
