import { drizzle } from "drizzle-orm/d1";
import { createClient } from "@libsql/client";
import { drizzle as drizzleSqlite } from "drizzle-orm/libsql";
import * as schema from "../server/db/schema";

const { category, product, productVariant, productImage } = schema;

// Mock data
const mockCategories = [
  { id: "cat-1", title: "Clothing", slug: "clothing", isActive: true, sort: 1 },
  {
    id: "cat-2",
    title: "Accessories",
    slug: "accessories",
    isActive: true,
    sort: 2,
  },
  { id: "cat-3", title: "Shoes", slug: "shoes", isActive: true, sort: 3 },
  {
    id: "cat-4",
    title: "Electronics",
    slug: "electronics",
    isActive: true,
    sort: 4,
  },
];

const mockSubCategories = [
  {
    id: "cat-5",
    title: "T-Shirts",
    slug: "t-shirts",
    parentCategoryId: "cat-1",
    sort: 1,
  },
  {
    id: "cat-6",
    title: "Hoodies",
    slug: "hoodies",
    parentCategoryId: "cat-1",
    sort: 2,
  },
  {
    id: "cat-7",
    title: "Pants",
    slug: "pants",
    parentCategoryId: "cat-1",
    sort: 3,
  },
  {
    id: "cat-8",
    title: "Bags",
    slug: "bags",
    parentCategoryId: "cat-2",
    sort: 1,
  },
  {
    id: "cat-9",
    title: "Watches",
    slug: "watches",
    parentCategoryId: "cat-2",
    sort: 2,
  },
  {
    id: "cat-10",
    title: "Sneakers",
    slug: "sneakers",
    parentCategoryId: "cat-3",
    sort: 1,
  },
  {
    id: "cat-11",
    title: "Boots",
    slug: "boots",
    parentCategoryId: "cat-3",
    sort: 2,
  },
  {
    id: "cat-12",
    title: "Headphones",
    slug: "headphones",
    parentCategoryId: "cat-4",
    sort: 1,
  },
  {
    id: "cat-13",
    title: "Speakers",
    slug: "speakers",
    parentCategoryId: "cat-4",
    sort: 2,
  },
];

const mockProducts = [
  {
    id: "prod-1",
    title: "Classic Cotton T-Shirt",
    slug: "classic-cotton-t-shirt",
    description:
      "Premium quality 100% cotton t-shirt. Soft, breathable, and perfect for everyday wear.",
    thumbnail:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    categoryId: "cat-5",
    colors: ["Black", "White", "Navy", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    basePrice: 149.99,
  },
  {
    id: "prod-2",
    title: "Graphic Print Tee",
    slug: "graphic-print-tee",
    description:
      "Express yourself with our artistic graphic tee. Made from soft cotton blend.",
    thumbnail:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500",
    categoryId: "cat-5",
    colors: ["White", "Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    basePrice: 179.99,
  },
  {
    id: "prod-3",
    title: "Premium Zip Hoodie",
    slug: "premium-zip-hoodie",
    description:
      "Stay warm in style with our premium zip-up hoodie. Soft fleece interior.",
    thumbnail:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
    categoryId: "cat-6",
    colors: ["Black", "Gray", "Navy"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    basePrice: 349.99,
  },
  {
    id: "prod-4",
    title: "Pullover Comfort Hoodie",
    slug: "pullover-comfort-hoodie",
    description:
      "Ultimate comfort pullover hoodie with adjustable drawstring hood.",
    thumbnail:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500",
    categoryId: "cat-6",
    colors: ["Black", "White", "Red", "Green"],
    sizes: ["S", "M", "L", "XL"],
    basePrice: 299.99,
  },
  {
    id: "prod-5",
    title: "Slim Fit Chinos",
    slug: "slim-fit-chinos",
    description: "Modern slim fit chinos crafted from stretch cotton.",
    thumbnail:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500",
    categoryId: "cat-7",
    colors: ["Black", "Navy", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    basePrice: 279.99,
  },
  {
    id: "prod-6",
    title: "Classic Denim Jeans",
    slug: "classic-denim-jeans",
    description: "Timeless straight-leg denim jeans with slight stretch.",
    thumbnail:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    categoryId: "cat-7",
    colors: ["Blue", "Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    basePrice: 329.99,
  },
  {
    id: "prod-7",
    title: "Leather Messenger Bag",
    slug: "leather-messenger-bag",
    description:
      "Handcrafted genuine leather messenger bag with multiple compartments.",
    thumbnail:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
    categoryId: "cat-8",
    colors: ["Black", "Brown"],
    sizes: ["One Size"],
    basePrice: 899.99,
  },
  {
    id: "prod-8",
    title: "Canvas Backpack",
    slug: "canvas-backpack",
    description: "Durable canvas backpack with leather accents.",
    thumbnail:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    categoryId: "cat-8",
    colors: ["Gray", "Navy", "Green"],
    sizes: ["One Size"],
    basePrice: 449.99,
  },
  {
    id: "prod-9",
    title: "Minimalist Steel Watch",
    slug: "minimalist-steel-watch",
    description: "Elegant minimalist watch with stainless steel case.",
    thumbnail:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    categoryId: "cat-9",
    colors: ["Silver", "Gold", "Rose Gold"],
    sizes: ["One Size"],
    basePrice: 1299.99,
  },
  {
    id: "prod-10",
    title: "Sport Digital Watch",
    slug: "sport-digital-watch",
    description: "Digital sports watch with heart rate monitor and GPS.",
    thumbnail:
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
    categoryId: "cat-9",
    colors: ["Black", "White"],
    sizes: ["One Size"],
    basePrice: 799.99,
  },
  {
    id: "prod-11",
    title: "Urban Runner Sneakers",
    slug: "urban-runner-sneakers",
    description: "Lightweight running sneakers with responsive cushioning.",
    thumbnail:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    categoryId: "cat-10",
    colors: ["Black", "White", "Red"],
    sizes: ["39", "40", "41", "42", "43", "44"],
    basePrice: 599.99,
  },
  {
    id: "prod-12",
    title: "Classic Canvas Sneakers",
    slug: "classic-canvas-sneakers",
    description: "Timeless canvas sneakers with vulcanized rubber sole.",
    thumbnail:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500",
    categoryId: "cat-10",
    colors: ["White", "Black", "Navy"],
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
    basePrice: 349.99,
  },
  {
    id: "prod-13",
    title: "Leather Chelsea Boots",
    slug: "leather-chelsea-boots",
    description: "Classic Chelsea boots in premium leather.",
    thumbnail:
      "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500",
    categoryId: "cat-11",
    colors: ["Black", "Brown"],
    sizes: ["39", "40", "41", "42", "43", "44", "45"],
    basePrice: 899.99,
  },
  {
    id: "prod-14",
    title: "Wireless Over-Ear Headphones",
    slug: "wireless-over-ear-headphones",
    description: "Premium wireless headphones with active noise cancellation.",
    thumbnail:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    categoryId: "cat-12",
    colors: ["Black", "White", "Navy"],
    sizes: ["One Size"],
    basePrice: 1499.99,
  },
  {
    id: "prod-15",
    title: "True Wireless Earbuds",
    slug: "true-wireless-earbuds",
    description: "Compact true wireless earbuds with crystal clear audio.",
    thumbnail:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
    categoryId: "cat-12",
    colors: ["Black", "White"],
    sizes: ["One Size"],
    basePrice: 699.99,
  },
  {
    id: "prod-16",
    title: "Portable Bluetooth Speaker",
    slug: "portable-bluetooth-speaker",
    description: "Powerful portable speaker with 360° sound.",
    thumbnail:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
    categoryId: "cat-13",
    colors: ["Black", "Blue", "Red"],
    sizes: ["One Size"],
    basePrice: 549.99,
  },
  {
    id: "prod-17",
    title: "Smart Home Speaker",
    slug: "smart-home-speaker",
    description: "Voice-controlled smart speaker with premium audio.",
    thumbnail:
      "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500",
    categoryId: "cat-13",
    colors: ["Black", "White", "Gray"],
    sizes: ["One Size"],
    basePrice: 449.99,
  },
];

async function seed() {
  // Connect to local D1 database file
  const client = createClient({
    url: "file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/800800f8c9e84d8582fd4935e07bb4ba.sqlite",
  });

  const db = drizzleSqlite(client, { schema });

  console.log("🌱 Starting seed...\n");

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await db.delete(productImage);
    await db.delete(productVariant);
    await db.delete(product);
    await db.delete(category);
    console.log("✅ Cleared existing data\n");

    // Insert main categories
    console.log("Inserting categories...");
    for (const cat of mockCategories) {
      await db.insert(category).values({
        id: cat.id,
        title: cat.title,
        slug: cat.slug,
        isActive: cat.isActive,
        sort: cat.sort,
      });
    }

    // Insert subcategories
    for (const sub of mockSubCategories) {
      await db.insert(category).values({
        id: sub.id,
        title: sub.title,
        slug: sub.slug,
        parentCategoryId: sub.parentCategoryId,
        isActive: true,
        sort: sub.sort,
      });
    }
    console.log(
      `✅ Inserted ${mockCategories.length + mockSubCategories.length} categories\n`,
    );

    // Insert products with variants
    console.log("Inserting products and variants...");
    let variantCount = 0;

    for (const prod of mockProducts) {
      // Insert product
      await db.insert(product).values({
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        description: prod.description,
        thumbnail: prod.thumbnail,
        status: "active",
        categoryId: prod.categoryId,
        colors: prod.colors,
        sizes: prod.sizes,
        sort: 0,
      });

      // Insert variants for each color/size combination
      let variantIndex = 0;
      for (const color of prod.colors) {
        for (const size of prod.sizes) {
          const priceVariation = Math.random() * 50 - 25;
          const stockVariation = Math.floor(Math.random() * 50) + 5;

          await db.insert(productVariant).values({
            id: `${prod.id}-var-${variantIndex++}`,
            productId: prod.id,
            sku: `${prod.slug}-${color.toLowerCase()}-${size.toLowerCase()}`.replace(
              /\s+/g,
              "-",
            ),
            price: Math.round((prod.basePrice + priceVariation) * 100) / 100,
            compareAtPrice:
              Math.random() > 0.7
                ? Math.round(prod.basePrice * 1.2 * 100) / 100
                : null,
            color,
            size,
            stockQuantity: stockVariation,
          });
          variantCount++;
        }
      }

      // Insert product image
      await db.insert(productImage).values({
        id: `${prod.id}-img-1`,
        productId: prod.id,
        url: prod.thumbnail,
        alt: prod.title,
        sort: 0,
      });
    }
    console.log(
      `✅ Inserted ${mockProducts.length} products with ${variantCount} variants\n`,
    );

    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  client.close();
}

seed();
