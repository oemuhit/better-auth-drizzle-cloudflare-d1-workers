<script setup lang="ts">
import { motion } from "motion-v";
import { Check } from "lucide-vue-next";

const features = [
  {
    title: "Wine Spectator",
    subtitle: "Appellation of Controlled Origin",
    description: "White dry wine of Appellation of Controlled Origin. Made from grape varieties cultivated in France. Modern edgy Full-Site editing theme with clean design and focus on products.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
    reverse: false
  },
  {
    title: "All-Natural Ingredients",
    subtitle: "Organic and Natural",
    description: "Nature is pure, and so are our products. We create plant-powered balms and oils formulated only with clean ingredients – you won’t find petrochemicals or synthetic fragrances in our collection.",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b0ca7df?w=800",
    reverse: true
  }
];
</script>

<template>
  <section class="py-24 bg-gray-50 overflow-hidden">
    <div class="container mx-auto px-4">
      <div v-for="(feature, i) in features" :key="i" class="mb-24 last:mb-0">
        <div 
          class="grid lg:grid-cols-2 gap-12 items-center"
          :class="{ 'lg:direction-rtl': feature.reverse }"
        >
          <!-- Image Side -->
          <motion.div
            :initial="{ opacity: 0, x: feature.reverse ? 50 : -50 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.8, delay: 0.2 }"
            class="relative aspect-video lg:aspect-square overflow-hidden rounded-2xl shadow-2xl"
          >
            <img 
              :src="feature.image" 
              :alt="feature.title" 
              class="w-full h-full object-cover"
            />
            <!-- Decorative element -->
            <div class="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          </motion.div>

          <!-- Text Side -->
          <motion.div
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.8, delay: 0.4 }"
            class="flex flex-col gap-6"
            :class="{ 'lg:pr-12': !feature.reverse, 'lg:pl-12': feature.reverse }"
          >
            <span class="text-primary font-medium tracking-[0.2em] uppercase text-xs">
              {{ feature.subtitle }}
            </span>
            <h2 class="text-4xl md:text-5xl font-serif text-gray-900 leading-tight">
              {{ feature.title }}
            </h2>
            <p class="text-lg text-gray-600 leading-relaxed font-light">
              {{ feature.description }}
            </p>
            
            <ul class="space-y-3 mt-4">
              <li v-for="item in 3" :key="item" class="flex items-center gap-3 text-gray-700">
                <div class="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check class="h-3 w-3 text-primary" />
                </div>
                <span class="text-sm font-light">Premium quality selection of grapes</span>
              </li>
            </ul>

            <div class="mt-8 flex">
               <Button variant="outline" class="rounded-none px-8 py-6 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 capitalize tracking-widest">
                 Read More
               </Button>
            </div>
          </motion.div>
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

.direction-rtl {
  direction: rtl;
}
.direction-rtl > * {
  direction: ltr;
}
</style>
