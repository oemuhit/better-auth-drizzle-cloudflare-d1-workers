<script setup lang="ts">
import { useImageUpload } from "~/composables/useImageUpload";

definePageMeta({
  layout: "admin",
  middleware: ["auth"],
});

const { uploadImage, isUploading } = useImageUpload();
const status = ref("");
const logs = ref<string[]>([]);

const addLog = (msg: string) => {
  logs.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
};

const productsToMigrate = [
  {
    title: "Strawberry Wine",
    slug: "strawberry-wine",
    price: 85,
    category: "Wines",
    shortDescription: "A delightful and refreshing wine infused with the essence of sun-ripened strawberries.",
    description: `
      <h2>Premium Strawberry Experience</h2>
      <p>Our Strawberry Wine is crafted from the finest hand-picked strawberries, capturing the essence of summer in every bottle. It offers a perfect balance of sweetness and acidity, making it an ideal companion for light desserts or as a refreshing aperitif.</p>
      <img src="https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=800" alt="Fresh Strawberries" style="width: 100%; border-radius: 8px; margin: 20px 0;" />
      <h3>Tasting Notes</h3>
      <ul>
        <li><strong>Aroma:</strong> Intense fresh strawberry bouquet with subtle floral notes.</li>
        <li><strong>Palate:</strong> Vibrant berry flavors with a smooth, lingering finish.</li>
        <li><strong>Color:</strong> Brilliant ruby red.</li>
      </ul>
      <p>Best served chilled (8-10°C). Perfect for celebrations or a quiet evening on the patio.</p>
    `,
    imageUrl: "https://catchspaces.sfo2.digitaloceanspaces.com/catchthemesfse/sites/56/2023/07/18050641/strawberry.png"
  },
  {
    title: "Poppiana Wine",
    slug: "poppiana-wine",
    price: 100,
    category: "Wines",
    shortDescription: "An elegant white dry wine made from premium grape varieties cultivated in the heart of France.",
    description: `
      <h2>The Art of French Winemaking</h2>
      <p>Poppiana Wine represents the pinnacle of dry white wine production. Cultivated in select vineyards across France, the grapes are harvested at perfect maturity to ensure a complex and sophisticated profile.</p>
      <img src="https://images.unsplash.com/photo-1528823331182-7aa2013ecd90?auto=format&fit=crop&q=80&w=800" alt="Vineyard" style="width: 100%; border-radius: 8px; margin: 20px 0;" />
      <h3>Specifications</h3>
      <p>This wine features high-altitude grape varieties that bring a unique minerality and crispness to the palate. It's a true reflection of the terroir and traditional winemaking techniques.</p>
      <blockquote>"A masterclass in balance and elegance." - Sommelier Daily</blockquote>
    `,
    imageUrl: "https://catchspaces.sfo2.digitaloceanspaces.com/catchthemesfse/sites/56/2023/07/18050724/poppiana.png"
  },
  {
    title: "Palm Wine",
    slug: "palm-wine",
    price: 75,
    category: "Wines",
    shortDescription: "A unique and traditional beverage with a modern, sophisticated twist.",
    description: `
      <h2>Traditional Roots, Modern Soul</h2>
      <p>Our Palm Wine is a celebration of heritage. Using age-old extraction methods refined for modern quality standards, we've created a drink that is both familiar and excitingly new.</p>
      <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800" alt="Wine Pour" style="width: 100%; border-radius: 8px; margin: 20px 0;" />
      <p>With its characteristic slight effervescence and sweet, milky profile, it's a versatile choice for adventurous palates.</p>
    `,
    imageUrl: "https://catchspaces.sfo2.digitaloceanspaces.com/catchthemesfse/sites/56/2023/07/04054209/palm-wine.png"
  },
  {
    title: "Organic Wine",
    slug: "organic-wine",
    price: 180,
    category: "Wines",
    shortDescription: "Certified organic grapes grown without synthetic additives, respecting nature at every step.",
    description: `
      <h2>Purity in a Bottle</h2>
      <p>Every sip of our Organic Wine tells a story of sustainability and respect for the land. No synthetic pesticides or fertilizers are used, allowing the natural character of the grapes to shine through.</p>
      <img src="https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&q=80&w=800" alt="Grapes" style="width: 100%; border-radius: 8px; margin: 20px 0;" />
      <p>Rich in polyphenols and antioxidants, our organic selection isn't just better for the planet—it's a richer tasting experience.</p>
    `,
    imageUrl: "https://catchspaces.sfo2.digitaloceanspaces.com/catchthemesfse/sites/56/2023/07/04054310/organic-wine.png"
  },
  {
    title: "Muscat Wine",
    slug: "muscat-wine",
    price: 100,
    compareAtPrice: 120,
    category: "Wines",
    shortDescription: "A sweet and intensely aromatic dessert wine that pairs perfectly with fruits and pastries.",
    description: `
      <h2>Sweet Sensation</h2>
      <p>The Muscat grape is known for its incredible aroma. We've preserved that intensity, creating a dessert wine that is as fragrant as a blooming garden.</p>
      <img src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80&w=800" alt="Dessert Wine" style="width: 100%; border-radius: 8px; margin: 20px 0;" />
      <p>Ideal for pairing with creamy desserts, blue cheeses, or simply enjoyed on its own at the end of a fine meal.</p>
    `,
    imageUrl: "https://catchspaces.sfo2.digitaloceanspaces.com/catchthemesfse/sites/56/2023/07/18050816/muscat.png"
  },
  {
    title: "Lanson Champagne",
    slug: "lanson-champagne",
    price: 120,
    compareAtPrice: 150,
    category: "Champagne",
    shortDescription: "A classic cuvée with fine bubbles and a crisp, sophisticated finish.",
    description: `
      <h2>The Sparkle of Excellence</h2>
      <p>Lanson Champagne is synonymous with celebration. With its signature crispness and vibrancy, it brings a touch of luxury to any occasion.</p>
      <img src="https://images.unsplash.com/photo-1594411643194-9a7442a8b23c?auto=format&fit=crop&q=80&w=800" alt="Champagne Toast" style="width: 100%; border-radius: 8px; margin: 20px 0;" />
      <p>Aging in cool cellars for years gives it a complex depth of flavor and exceptionally fine bubbles.</p>
    `,
    imageUrl: "https://catchspaces.sfo2.digitaloceanspaces.com/catchthemesfse/sites/56/2023/07/04054505/lanson-wine-1.png"
  }
];

async function startMigration() {
  status.value = "Migrating...";
  addLog("Starting migration...");

  for (const item of productsToMigrate) {
    try {
      addLog(`\n--- Processing ${item.title} ---`);
      
      // 1. Fetch image via proxy
      addLog(`Step 1/3: Downloading image from ${item.imageUrl}...`);
      const imgRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`);
      
      if (!imgRes.ok) {
        const errorText = await imgRes.text();
        throw new Error(`Download failed: ${imgRes.status} ${imgRes.statusText}${errorText ? ' - ' + errorText : ''}`);
      }
      
      const blob = await imgRes.blob();
      if (blob.size === 0) throw new Error("Downloaded image is empty (0 bytes)");
      
      addLog(`Successfully downloaded image (${Math.round(blob.size / 1024)} KB)`);
      
      const file = new File([blob], `${item.slug}.png`, { type: "image/png" });

      // 2. Upload using existing jsquash + R2 logic
      addLog(`Step 2/3: Optimizing and uploading to R2...`);
      const uploadResult = await uploadImage(file);
      
      if (!uploadResult.success) {
        throw new Error(`Upload failed: ${uploadResult.error || "Unknown server error"}`);
      }

      if (!uploadResult.files || uploadResult.files.length === 0) {
        throw new Error("Upload succeeded but no files were returned");
      }
      
      const thumbnail = uploadResult.imageId;
      
      addLog(`Successfully uploaded. Image ID: ${thumbnail}`);

      // 3. Save to database
      addLog(`Step 3/3: Saving product data to database...`);
      const dbResult = await $fetch("/api/admin/migrate-drinkify", {
        method: "POST",
        body: {
          ...item,
          thumbnail,
          images: [thumbnail] // Use ID in gallery too
        }
      }) as any;

      if (!dbResult.success) {
        throw new Error(`Database save failed: ${dbResult.error || "Unknown error"}`);
      }

      addLog(`✅ Successfully migrated ${item.title}`);
    } catch (err: any) {
      addLog(`❌ Error migrating ${item.title}: ${err.message}`);
      console.error(`Migration error for ${item.title}:`, err);
    }
  }

  status.value = "Done";
  addLog("\n--- Migration finished ---");
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Drinkify Data Migration</h1>
      <Button @click="startMigration" :disabled="isUploading">
        {{ isUploading ? "Processing..." : "Start Migration" }}
      </Button>
    </div>

    <div class="grid gap-4 md:grid-cols-2 mb-8">
      <Card v-for="item in productsToMigrate" :key="item.slug">
        <CardHeader>
          <CardTitle>{{ item.title }}</CardTitle>
          <CardDescription>{{ item.category }} - {{ item.price }}₺</CardDescription>
        </CardHeader>
      </Card>
    </div>

    <div class="bg-black text-green-500 font-mono p-4 rounded h-64 overflow-y-auto">
      <div v-for="(log, i) in logs" :key="i" class="mb-1 text-sm">{{ log }}</div>
      <div v-if="logs.length === 0" class="text-gray-500 italic">Logs will appear here...</div>
    </div>
  </div>
</template>
