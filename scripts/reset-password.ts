/**
 * Password Reset Script for admin@example.com
 *
 * Run with: npx wrangler d1 execute nuxtdb --local --command "UPDATE user SET ... "
 * OR use the Better Auth approach below
 */

import { Argon2id } from "oslo/password";

async function hashPassword(password: string): Promise<string> {
  const argon2id = new Argon2id();
  return await argon2id.hash(password);
}

// Generate the hash
const newPassword = "Admin123!"; // Change this to your desired password

hashPassword(newPassword).then((hash) => {
  console.log("\n=== Password Reset SQL ===\n");
  console.log(
    `UPDATE account SET password = '${hash}' WHERE user_id = (SELECT id FROM user WHERE email = 'admin@example.com');`,
  );
  console.log("\n=== Run this command ===\n");
  console.log(
    `npx wrangler d1 execute nuxtdb --local --command "UPDATE account SET password = '${hash}' WHERE user_id = (SELECT id FROM user WHERE email = 'admin@example.com');"`,
  );
  console.log("\n");
});
