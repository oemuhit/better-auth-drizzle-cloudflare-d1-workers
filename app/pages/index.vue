<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import { motion } from "motion-v";
definePageMeta({
  layout: "default",
});

useHead({
  title: "Ana Sayfa | Shop",
});

// Fetch categories
const { data: categoriesData } = await useFetch("/api/categories", {
  query: { parentOnly: true },
});

// Fetch popular products
const { data: productsData } = await useFetch("/api/products", {
  query: { limit: 8, sortBy: "createdAt", sortOrder: "desc" },
});

const categories = computed(() => categoriesData.value?.data || []);
const products = computed(() => productsData.value?.data || []);
</script>

<template>

   
  <div>
    <!-- Hero Section -->
    <HeroSection
      title="Yeni Sezon Koleksiyonu"
      subtitle="Yeni Gelenler"
      description="En son trendleri ve stilleri keşfedin. Yeni sezon ürünlerimizi hemen inceleyin ve tarzınızı yansıtın."
      button-text="Alışverişe Başla"
      button-link="/shop"
      image-url="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"
    />
    <motion.div
        class="box"
        :animate="{ rotate: 360 }"
        :transition="{ duration: 1 }"
    />
    <!-- Feature Icons -->
    <FeatureIcons />

    <!-- Shop by Category -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold">Kategorilere Göz At</h2>
            <p class="text-muted-foreground mt-1">
              İhtiyacın olan her şey burada
            </p>
          </div>
          <NuxtLink
            to="/shop"
            class="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tümünü Gör
            <ArrowRight class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <CategoryCard
            v-for="category in categories.slice(0, 4)"
            :key="category.id"
            :title="category.title"
            :slug="category.slug"
          />
        </div>

        <div class="mt-6 text-center sm:hidden">
          <NuxtLink to="/shop">
            <Button variant="outline">
              Tümünü Gör
              <ArrowRight class="h-4 w-4 ml-2" />
            </Button>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Popular Products -->
    <section class="py-16 bg-muted/30">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold">Popüler Ürünler</h2>
            <p class="text-muted-foreground mt-1">
              En çok tercih edilen ürünler
            </p>
          </div>
          <NuxtLink
            to="/shop"
            class="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tümünü Gör
            <ArrowRight class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <div class="mt-8 text-center sm:hidden">
          <NuxtLink to="/shop">
            <Button variant="outline">
              Tümünü Gör
              <ArrowRight class="h-4 w-4 ml-2" />
            </Button>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div
          class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
        >
          <div
            class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200')] bg-cover bg-center opacity-20"
          />
          <div class="relative px-8 py-16 md:py-24 text-center">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              İndirimli Ürünleri Kaçırma!
            </h2>
            <p class="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Seçili ürünlerde %50'ye varan indirimler. Fırsatları kaçırmadan
              alışverişe başla.
            </p>
            <NuxtLink to="/shop">
              <Button size="lg" variant="secondary" class="gap-2">
                Hemen İncele
                <ArrowRight class="h-4 w-4" />
              </Button>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- New Arrivals -->
    <section class="py-16 bg-muted/30">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold">Yeni Gelenler</h2>
            <p class="text-muted-foreground mt-1">
              En yeni ürünlerimizi keşfedin
            </p>
          </div>
          <NuxtLink
            to="/shop?sort=newest"
            class="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tümünü Gör
            <ArrowRight class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <ProductCard
            v-for="product in products.slice(0, 4)"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.box {
    width: 100px;
    height: 100px;
    background-color: #0cdcf7;
    border-radius: 5px;
}
</style>
