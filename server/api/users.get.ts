import { useDb } from "../utils/db";
import { user } from "../db/schema/auth-schema";

export default defineEventHandler(async (event) => {
  // Row definition

  const { results } = await event.context.cloudflare.env.nuxtdb
    .prepare("SELECT * FROM user")
    .run();

  console.log("results via D1");
  console.log(results);
  console.log("results via Drizzle");
  const db = useDb(event);

  const users = await db.select().from(user);
  console.log(users);
  return users;
});
