<script setup lang="ts">
import { motion } from "motion-v";

const props = defineProps<{
  product: any;
}>();

const isHovered = ref(false);

const imageUrl = computed(() => {
  if (!props.product.thumbnail) return '/placeholder-bottle.png';
  return props.product.thumbnail.startsWith('http') 
    ? props.product.thumbnail 
    : `/images/${props.product.thumbnail}`;
});
</script>

<template>
  <div 
    class="group flex flex-col items-center"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Card Wrapper -->
    <div class="relative w-full h-[360px] flex items-end justify-center mb-6">
      <!-- Gray Background Area -->
      <motion.div 
        class="absolute bottom-0 w-full bg-[#eee] rounded-[1.2rem] z-0 overflow-hidden"
        :animate="isHovered ? { height: '300px' } : { height: '200px' }"
        :transition="{ type: 'spring', stiffness: 300, damping: 20 }"
      >
        <!-- White Square (on hover) -->
        <motion.div 
          class="absolute inset-0 m-auto w-[200px] h-[200px] bg-white z-0"
          :initial="{ opacity: 0, scale: 0.8 }"
          :animate="isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }"
          :transition="{ duration: 0.4 }"
        />
      </motion.div>

      <!-- Shadow (on hover) -->
      <motion.div 
        class="absolute bottom-[10%] w-[60px] h-2 bg-black/10 blur-xl rounded-[100%] z-10"
        :initial="{ opacity: 0, scale: 0.5 }"
        :animate="isHovered ? { opacity: 1, scale: 1.2 } : { opacity: 0, scale: 0.5 }"
        :transition="{ duration: 0.4 }"
      />

      <!-- Floating Bottle -->
      <motion.img
        :src="imageUrl"
        :alt="product.title"
        class="relative h-[280px] w-auto object-contain z-20 pb-2"
        :animate="isHovered ? { y: -10 } : { y: 0 }"
        :transition="{ type: 'spring', stiffness: 300, damping: 20 }"
      />

      <!-- Sale Tag (Optional) -->
      <div v-if="product.compareAtPrice" class="absolute top-[30%] right-2 bg-[#ff6b35] text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 z-30">
        Sale
      </div>
    </div>

    <!-- Product Info (Left aligned content below card) -->
    <div class="w-full space-y-1 text-left">
      <NuxtLink :to="`/shop/${product.slug}`">
        <h3 
          class="text-xl font-serif transition-colors duration-300 line-clamp-1"
          :class="isHovered ? 'text-[#d87943]' : 'text-gray-900'"
        >
          {{ product.title }}
        </h3>
      </NuxtLink>
      <div class="text-lg font-bold text-gray-900">
        ${{ product.basePrice.toFixed(2) }}
      </div>
      
      <div class="pt-3">
        <Button 
          class="bg-[#8b8b45] hover:bg-[#7a7a3d] text-white rounded-none px-6 h-10 uppercase tracking-tight text-xs font-bold border-none transition-transform active:scale-95"
          @click.stop
        >
          Add To Cart
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&display=swap');
.font-serif {
  font-family: 'Playfair Display', serif;
}
</style>
