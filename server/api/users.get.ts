import { useDb } from "../utils/db";
import { user } from "../db/schema/auth-schema";

export default defineEventHandler(async (event) => {
  // Row definition

  /*   const response = await event.context.cloudflare.env.AI.run(
    "@cf/meta/llama-3.1-8b-instruct",
    {
      prompt: "What is the origin of the phrase Hello, World",
    }
  );
  console.log(response); */

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
