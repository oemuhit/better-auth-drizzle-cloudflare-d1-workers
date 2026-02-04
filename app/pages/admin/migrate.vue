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
    description: "Organic and natural grapes ingredients. Pure nature in every sip.",
    imageUrl: "https://fse.catchthemes.com/drinkify/wp-content/themes/drinkify/assets/images/bottle.png"
  },
  {
    title: "Poppiana Wine",
    slug: "poppiana-wine",
    price: 100,
    category: "Wines",
    description: "Elegant white dry wine from premium French varieties.",
    imageUrl: "https://fse.catchthemes.com/drinkify/wp-content/themes/drinkify/assets/images/bottle.png"
  },
  {
    title: "Palm Wine",
    slug: "palm-wine",
    price: 75,
    category: "Wines",
    description: "Traditional taste with a modern touch.",
    imageUrl: "https://fse.catchthemes.com/drinkify/wp-content/themes/drinkify/assets/images/bottle.png"
  },
  {
    title: "Organic Wine",
    slug: "organic-wine",
    price: 180,
    category: "Wines",
    description: "Certified organic grapes, no synthetic additives.",
    imageUrl: "https://fse.catchthemes.com/drinkify/wp-content/themes/drinkify/assets/images/bottle.png"
  },
  {
    title: "Muscat Wine",
    slug: "muscat-wine",
    price: 100,
    compareAtPrice: 120,
    category: "Wines",
    description: "Sweet and aromatic, perfect for desserts.",
    imageUrl: "https://fse.catchthemes.com/drinkify/wp-content/themes/drinkify/assets/images/bottle.png"
  },
  {
    title: "Lanson Champagne",
    slug: "lanson-champagne",
    price: 120,
    compareAtPrice: 150,
    category: "Champagne",
    description: "Classic cuvée with fine bubbles and crisp finish.",
    imageUrl: "https://fse.catchthemes.com/drinkify/wp-content/themes/drinkify/assets/images/bottle.png"
  }
];

async function startMigration() {
  status.value = "Migrating...";
  addLog("Starting migration...");

  for (const item of productsToMigrate) {
    try {
      addLog(`Processing ${item.title}...`);
      
      // 1. Fetch image via proxy
      addLog(`Downloading image for ${item.title}...`);
      const imgRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`);
      if (!imgRes.ok) throw new Error("Failed to download image");
      const blob = await imgRes.blob();
      const file = new File([blob], `${item.slug}.png`, { type: "image/png" });

      // 2. Upload using existing jsquash + R2 logic
      addLog(`Uploading and resizing ${item.title}...`);
      const uploadResult = await uploadImage(file);
      
      if (!uploadResult.success) throw new Error(uploadResult.error || "Upload failed");

      // 3. Save to database
      addLog(`Saving ${item.title} to database...`);
      await $fetch("/api/admin/migrate-drinkify", {
        method: "POST",
        body: {
          ...item,
          thumbnail: uploadResult.files.find((f: string) => f.includes("512w")) || uploadResult.files[0]
        }
      });

      addLog(`Successfully migrated ${item.title}`);
    } catch (err: any) {
      addLog(`Error migrating ${item.title}: ${err.message}`);
      console.error(err);
    }
  }

  status.value = "Done";
  addLog("Migration finished.");
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
