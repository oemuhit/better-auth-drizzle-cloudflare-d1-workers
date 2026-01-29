import { sql } from "drizzle-orm";
import { useDb } from "../../utils/db";
import {
  category,
  product,
  productVariant,
  productImage,
} from "../../db/schema";

// Mock data based on Directus ecommerce template
const mockCategories = [
  { title: "Clothing", slug: "clothing", isActive: true, sort: 1 },
  { title: "Accessories", slug: "accessories", isActive: true, sort: 2 },
  { title: "Shoes", slug: "shoes", isActive: true, sort: 3 },
  { title: "Electronics", slug: "electronics", isActive: true, sort: 4 },
];

const mockSubCategories = [
  { title: "T-Shirts", slug: "t-shirts", parentSlug: "clothing", sort: 1 },
  { title: "Hoodies", slug: "hoodies", parentSlug: "clothing", sort: 2 },
  { title: "Pants", slug: "pants", parentSlug: "clothing", sort: 3 },
  { title: "Bags", slug: "bags", parentSlug: "accessories", sort: 1 },
  { title: "Watches", slug: "watches", parentSlug: "accessories", sort: 2 },
  { title: "Sneakers", slug: "sneakers", parentSlug: "shoes", sort: 1 },
  { title: "Boots", slug: "boots", parentSlug: "shoes", sort: 2 },
  {
    title: "Headphones",
    slug: "headphones",
    parentSlug: "electronics",
    sort: 1,
  },
  { title: "Speakers", slug: "speakers", parentSlug: "electronics", sort: 2 },
];

const colors = ["Black", "White", "Navy", "Gray", "Red", "Green", "Blue"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const shoeSizes = ["38", "39", "40", "41", "42", "43", "44", "45"];

const mockProducts = [
  // T-Shirts
  {
    title: "Classic Cotton T-Shirt",
    slug: "classic-cotton-t-shirt",
    description:
      "Premium quality 100% cotton t-shirt. Soft, breathable, and perfect for everyday wear. Features a classic fit with reinforced stitching for durability.",
    thumbnail:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    categorySlug: "t-shirts",
    colors: ["Black", "White", "Navy", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    basePrice: 149.99,
  },
  {
    title: "Graphic Print Tee",
    slug: "graphic-print-tee",
    description:
      "Express yourself with our artistic graphic tee. Made from soft cotton blend with vibrant, fade-resistant prints.",
    thumbnail:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500",
    categorySlug: "t-shirts",
    colors: ["White", "Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    basePrice: 179.99,
  },
  {
    title: "V-Neck Essential Tee",
    slug: "v-neck-essential-tee",
    description:
      "Elegant V-neck design perfect for layering or wearing solo. Lightweight and breathable cotton fabric.",
    thumbnail:
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500",
    categorySlug: "t-shirts",
    colors: ["Black", "White", "Navy"],
    sizes: ["XS", "S", "M", "L", "XL"],
    basePrice: 129.99,
  },
  // Hoodies
  {
    title: "Premium Zip Hoodie",
    slug: "premium-zip-hoodie",
    description:
      "Stay warm in style with our premium zip-up hoodie. Features a soft fleece interior, metal zipper, and kangaroo pockets.",
    thumbnail:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
    categorySlug: "hoodies",
    colors: ["Black", "Gray", "Navy"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    basePrice: 349.99,
  },
  {
    title: "Pullover Comfort Hoodie",
    slug: "pullover-comfort-hoodie",
    description:
      "Ultimate comfort pullover hoodie with adjustable drawstring hood. Perfect for lounging or casual outings.",
    thumbnail:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500",
    categorySlug: "hoodies",
    colors: ["Black", "White", "Red", "Green"],
    sizes: ["S", "M", "L", "XL"],
    basePrice: 299.99,
  },
  // Pants
  {
    title: "Slim Fit Chinos",
    slug: "slim-fit-chinos",
    description:
      "Modern slim fit chinos crafted from stretch cotton. Versatile enough for work or weekend wear.",
    thumbnail:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500",
    categorySlug: "pants",
    colors: ["Black", "Navy", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    basePrice: 279.99,
  },
  {
    title: "Classic Denim Jeans",
    slug: "classic-denim-jeans",
    description:
      "Timeless straight-leg denim jeans. Premium quality denim with slight stretch for comfort.",
    thumbnail:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    categorySlug: "pants",
    colors: ["Blue", "Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    basePrice: 329.99,
  },
  // Bags
  {
    title: "Leather Messenger Bag",
    slug: "leather-messenger-bag",
    description:
      "Handcrafted genuine leather messenger bag. Features multiple compartments, adjustable strap, and brass hardware.",
    thumbnail:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
    categorySlug: "bags",
    colors: ["Black", "Brown"],
    sizes: ["One Size"],
    basePrice: 899.99,
  },
  {
    title: "Canvas Backpack",
    slug: "canvas-backpack",
    description:
      "Durable canvas backpack with leather accents. Perfect for daily commute or weekend adventures.",
    thumbnail:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    categorySlug: "bags",
    colors: ["Gray", "Navy", "Green"],
    sizes: ["One Size"],
    basePrice: 449.99,
  },
  // Watches
  {
    title: "Minimalist Steel Watch",
    slug: "minimalist-steel-watch",
    description:
      "Elegant minimalist watch with stainless steel case and genuine leather strap. Water resistant up to 50m.",
    thumbnail:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    categorySlug: "watches",
    colors: ["Silver", "Gold", "Rose Gold"],
    sizes: ["One Size"],
    basePrice: 1299.99,
  },
  {
    title: "Sport Digital Watch",
    slug: "sport-digital-watch",
    description:
      "Feature-packed digital sports watch with heart rate monitor, GPS, and 7-day battery life.",
    thumbnail:
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
    categorySlug: "watches",
    colors: ["Black", "White"],
    sizes: ["One Size"],
    basePrice: 799.99,
  },
  // Sneakers
  {
    title: "Urban Runner Sneakers",
    slug: "urban-runner-sneakers",
    description:
      "Lightweight running sneakers with responsive cushioning. Breathable mesh upper and durable rubber outsole.",
    thumbnail:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    categorySlug: "sneakers",
    colors: ["Black", "White", "Red"],
    sizes: shoeSizes,
    basePrice: 599.99,
    isShoe: true,
  },
  {
    title: "Classic Canvas Sneakers",
    slug: "classic-canvas-sneakers",
    description:
      "Timeless canvas sneakers that go with everything. Vulcanized rubber sole for authentic skate style.",
    thumbnail:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500",
    categorySlug: "sneakers",
    colors: ["White", "Black", "Navy"],
    sizes: shoeSizes,
    basePrice: 349.99,
    isShoe: true,
  },
  // Boots
  {
    title: "Leather Chelsea Boots",
    slug: "leather-chelsea-boots",
    description:
      "Classic Chelsea boots in premium leather. Elastic side panels for easy on/off. Goodyear welted construction.",
    thumbnail:
      "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500",
    categorySlug: "boots",
    colors: ["Black", "Brown"],
    sizes: shoeSizes,
    basePrice: 899.99,
    isShoe: true,
  },
  // Headphones
  {
    title: "Wireless Over-Ear Headphones",
    slug: "wireless-over-ear-headphones",
    description:
      "Premium wireless headphones with active noise cancellation. 30-hour battery life and premium sound quality.",
    thumbnail:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    categorySlug: "headphones",
    colors: ["Black", "White", "Navy"],
    sizes: ["One Size"],
    basePrice: 1499.99,
  },
  {
    title: "True Wireless Earbuds",
    slug: "true-wireless-earbuds",
    description:
      "Compact true wireless earbuds with crystal clear audio. IPX5 water resistant with 8-hour battery.",
    thumbnail:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
    categorySlug: "headphones",
    colors: ["Black", "White"],
    sizes: ["One Size"],
    basePrice: 699.99,
  },
  // Speakers
  {
    title: "Portable Bluetooth Speaker",
    slug: "portable-bluetooth-speaker",
    description:
      "Powerful portable speaker with 360° sound. Waterproof design perfect for outdoor adventures.",
    thumbnail:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
    categorySlug: "speakers",
    colors: ["Black", "Blue", "Red"],
    sizes: ["One Size"],
    basePrice: 549.99,
  },
  {
    title: "Smart Home Speaker",
    slug: "smart-home-speaker",
    description:
      "Voice-controlled smart speaker with premium audio. Built-in assistant for hands-free control.",
    thumbnail:
      "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500",
    categorySlug: "speakers",
    colors: ["Black", "White", "Gray"],
    sizes: ["One Size"],
    basePrice: 449.99,
  },
];

// DELETE THIS ENDPOINT AFTER SEEDING!
export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const body = await readBody(event);

  if (body?.secretKey !== "SEED_KEY_12345") {
    throw createError({ statusCode: 403, statusMessage: "Invalid secret key" });
  }

  try {
    // Note: Run this SQL first to clear data:
    // DELETE FROM product_image; DELETE FROM product_variant; DELETE FROM product; DELETE FROM category;

    // Create main categories
    const categoryMap = new Map<string, string>();

    for (const cat of mockCategories) {
      const [created] = await db
        .insert(category)
        .values({
          title: cat.title,
          slug: cat.slug,
          isActive: cat.isActive,
          sort: cat.sort,
        })
        .returning();
      categoryMap.set(cat.slug, created.id);
    }

    // Create subcategories
    for (const sub of mockSubCategories) {
      const parentId = categoryMap.get(sub.parentSlug);
      const [created] = await db
        .insert(category)
        .values({
          title: sub.title,
          slug: sub.slug,
          parentCategoryId: parentId,
          isActive: true,
          sort: sub.sort,
        })
        .returning();
      categoryMap.set(sub.slug, created.id);
    }

    // Create products with variants
    for (const prod of mockProducts) {
      const categoryId = categoryMap.get(prod.categorySlug);

      const [createdProduct] = await db
        .insert(product)
        .values({
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          thumbnail: prod.thumbnail,
          status: "active",
          categoryId,
          colors: prod.colors,
          sizes: prod.sizes,
          sort: 0,
        })
        .returning();

      // Create variants for each color/size combination
      for (const color of prod.colors) {
        for (const size of prod.sizes) {
          const priceVariation = Math.random() * 50 - 25; // -25 to +25
          const stockVariation = Math.floor(Math.random() * 50) + 5; // 5 to 55

          await db.insert(productVariant).values({
            productId: createdProduct.id,
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
        }
      }

      // Add product images
      const imageUrls = [
        prod.thumbnail,
        prod.thumbnail.replace("w=500", "w=600"),
      ];

      for (let i = 0; i < imageUrls.length; i++) {
        await db.insert(productImage).values({
          productId: createdProduct.id,
          url: imageUrls[i],
          alt: `${prod.title} - Image ${i + 1}`,
          sort: i,
        });
      }
    }

    return {
      success: true,
      message: "Database seeded successfully!",
      data: {
        categories: mockCategories.length + mockSubCategories.length,
        products: mockProducts.length,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to seed database",
      data: error.message,
    });
  }
});
