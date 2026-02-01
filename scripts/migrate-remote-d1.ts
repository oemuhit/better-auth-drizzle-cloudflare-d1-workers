import { execSync } from "child_process";

async function migrateRemote() {
    console.log("🔍 Scanning remote D1 for legacy URL-based images...");

    const tables = [
        { name: "category", imageCol: "image", titleCol: "title" },
        { name: "product", imageCol: "thumbnail", titleCol: "title" },
        { name: "product_variant", imageCol: "image", titleCol: "sku" },
        { name: "product_image", imageCol: "url", titleCol: "id" }
    ];

    const clear = process.argv.includes("--clear");

    for (const table of tables) {
        console.log(`\n--- Table: ${table.name} ---`);

        // Find legacy URLs
        const query = `SELECT id, ${table.titleCol}, ${table.imageCol} FROM ${table.name} WHERE ${table.imageCol} LIKE 'http%' OR ${table.imageCol} LIKE 'https%' OR ${table.imageCol} LIKE '/%'`;

        try {
            const output = execSync(`wrangler d1 execute nuxtdb --remote --command="${query}" --json`, { encoding: "utf-8" });
            const results = JSON.parse(output);
            const items = results[0]?.results || [];

            if (items.length === 0) {
                console.log(`✅ No legacy URLs found in ${table.name}.`);
                continue;
            }

            console.log(`Found ${items.length} legacy URLs:`);
            items.forEach((item: any) => {
                console.log(`  - ${item[table.titleCol]} (${item.id}): ${item[table.imageCol]}`);
            });

            if (clear) {
                console.log(`🧹 Clearing ${items.length} URLs in ${table.name}...`);
                for (const item of items) {
                    let updateQuery;
                    if (table.name === "product_image") {
                        updateQuery = `DELETE FROM ${table.name} WHERE id = '${item.id}'`;
                    } else {
                        updateQuery = `UPDATE ${table.name} SET ${table.imageCol} = NULL WHERE id = '${item.id}'`;
                    }
                    execSync(`wrangler d1 execute nuxtdb --remote --command="${updateQuery}"`, { stdio: "inherit" });
                }
                console.log(`✅ Cleared ${table.name}.`);
            }
        } catch (error: any) {
            console.error(`❌ Error processing ${table.name}:`, error.message);
        }
    }

    if (!clear) {
        console.log("\n⚠️ To clear these legacy URLs, run this script with --clear flag.");
    } else {
        console.log("\n🎉 Remote migration completed successfully!");
    }
}

migrateRemote();
