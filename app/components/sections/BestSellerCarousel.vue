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
    <div class="container mx-auto px-4">
      <!-- Section Header -->
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

      <!-- Carousel Container -->
      <div class="relative group">
        <!-- Navigation Buttons -->
        <button 
          @click="scroll('left')"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
        >
          <ChevronLeft class="h-6 w-6" />
        </button>
        
        <button 
          @click="scroll('right')"
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
        >
          <ChevronRight class="h-6 w-6" />
        </button>

        <!-- Scrollable Wrapper -->
        <div 
          ref="scrollContainer"
          class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-8"
        >
          <div 
            v-for="(product, i) in products" 
            :key="product.id"
            class="min-w-[200px] md:min-w-[240px] lg:min-w-[280px] flex-shrink-0"
          >
            <DrinkifyProductCard :product="product" />
          </div>
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
