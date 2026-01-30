<script setup lang="ts">
defineProps<{
  title: string;
  slug: string;
  imageUrl?: string;
  productCount?: number;
}>();

// Placeholder images for categories
const categoryImages: Record<string, string> = {
  clothing: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400",
  "t-shirts":
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
  hoodies: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
  pants: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400",
  accessories:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
  bags: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
  watches: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400",
  shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
  sneakers:
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400",
  boots: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400",
  electronics:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
  headphones:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
  speakers:
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
};
</script>

<template>
  <NuxtLink
    :to="`/shop/category/${slug}`"
    class="group relative block aspect-square overflow-hidden rounded-2xl bg-muted"
  >
    <img
      :src="
        imageUrl ||
        categoryImages[slug] ||
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'
      "
      :alt="title"
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
    <!-- Overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
    />
    <!-- Content -->
    <div
      class="absolute inset-0 flex flex-col items-center justify-end p-4 text-white"
    >
      <h3 class="text-lg font-semibold text-center">{{ title }}</h3>
      <p v-if="productCount" class="text-sm text-white/80 mt-1">
        {{ productCount }} ürün
      </p>
    </div>
  </NuxtLink>
</template>
