<script setup lang="ts">
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-vue-next";
import { motion } from "motion-v";

const props = defineProps<{
  products: any[];
}>();

const scrollContainer = ref<HTMLElement | null>(null);

const scroll = (direction: 'left' | 'right') => {
  if (!scrollContainer.value) return;
  const scrollAmount = 350;
  scrollContainer.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  });
};
</script>

<template>
  <section class="py-24 bg-white overflow-hidden">
    <!-- Header stays in container -->
    <div class="container mx-auto px-4">
      <div class="flex items-end justify-between mb-12 border-b border-gray-100 pb-6">
        <motion.h2 
           class="text-4xl md:text-5xl font-serif text-gray-900"
           :initial="{ opacity: 0, x: -30 }"
           :animate="{ opacity: 1, x: 0 }"
           :transition="{ duration: 0.8 }"
        >
          Best Seller
        </motion.h2>

        <NuxtLink 
          to="/shop" 
          class="group flex items-center gap-2 text-[#8b8b45] font-bold tracking-tight mb-2 hover:text-[#7a7a3d] transition-colors"
        >
          <span class="text-lg">All Natural Wines</span>
          <ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-2" />
        </NuxtLink>
      </div>
    </div>

    <!-- Carousel is full-width -->
    <div class="relative w-full">
      <!-- Navigation Buttons -->
      <button 
        type="button"
        @click.stop.prevent="scroll('left')"
        class="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-600 hover:text-primary hover:bg-gray-50 transition-all duration-300 cursor-pointer"
        aria-label="Önceki"
      >
        <ChevronLeft class="h-6 w-6" />
      </button>
      
      <button 
        type="button"
        @click.stop.prevent="scroll('right')"
        class="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-600 hover:text-primary hover:bg-gray-50 transition-all duration-300 cursor-pointer"
        aria-label="Sonraki"
      >
        <ChevronRight class="h-6 w-6" />
      </button>

      <!-- Scrollable Wrapper - Full width -->
      <div 
        ref="scrollContainer"
        class="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-8 px-8 md:px-16"
      >
        <div 
          v-for="(product, i) in products" 
          :key="product.id"
          class="min-w-[220px] md:min-w-[280px] lg:min-w-[320px] flex-shrink-0"
        >
          <DrinkifyProductCard :product="product" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&display=swap');

.font-serif {
  font-family: 'Playfair Display', serif;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
