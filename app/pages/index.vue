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
    <!-- Drinkify Hero -->
    <DrinkifyHero 
      title="Sweet Elegant Fine Winery"
      subtitle="Exquisite Selection"
      description="Experience the perfect blend of tradition and elegance with our hand-picked selection of fine wines."
      button-text="Explore Collection"
      button-link="/shop"
    />

    <!-- Best Seller Carousel -->
    <BestSellerCarousel 
      v-if="products.length > 0"
      :products="products"
    />



    <div class="container mx-auto px-4 py-12">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <h2 class="text-3xl font-bold mb-4 tracking-tight">Ürün Boyutu Görselleştirici</h2>
        <p class="text-muted-foreground">Günlük eşyalarınızın çanta içerisinde nasıl duracağını ve kapladığı alanı gerçek boyutlarıyla deneyimleyin.</p>
      </div>
      
      <div class="max-w-5xl mx-auto">
        <BagVisualizer />
      </div>
    </div>




      <div class="flex w-full justify-center">
    <div
      class="rounded-3xl border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <Compare
        first-image="https://cdn.kaft.com/mnresize/1700/1700/static/images/bag/1721_1.jpg?cacheID=1762588612000"
        second-image="https://cdn.kaft.com/mnresize/1700/1700/static/images/bag/1723_1.jpg?cacheID=1762588612000"
        first-content-class="object-cover object-left-top rounded-xl overflow-hidden"
        second-content-class="object-cover object-left-top rounded-xl overflow-hidden"
        class=" md:h-[600px] md:w-[600px]"
        slide-mode="hover"
      />
    </div>
  </div>





    <!-- Feature Section -->
    <DrinkifyFeatureSection />

    <!-- Shop by Category (Keep existing for variety) -->
    <section class="py-24 bg-white border-t">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-serif mb-4">Browse Categories</h2>
          <p class="text-muted-foreground font-light tracking-wide">
            Find the perfect match for any occasion
          </p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <CategoryCard
            v-for="category in categories.slice(0, 4)"
            :key="category.id"
            :title="category.title"
            :slug="category.slug"
          />
        </div>
      </div>
    </section>

    <!-- Popular Products (Keep existing grid) -->
    <section class="py-24 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-12">
          <h2 class="text-3xl font-serif">Recent Arrivals</h2>
          <NuxtLink to="/shop" class="text-primary hover:tracking-widest transition-all">
            View All →
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <DrinkifyProductCard
            v-for="product in products.slice(0, 8)"
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
