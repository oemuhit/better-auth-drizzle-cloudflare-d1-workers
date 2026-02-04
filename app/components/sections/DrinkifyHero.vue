<script setup lang="ts">
import { motion } from "motion-v";
import { ArrowRight } from "lucide-vue-next";

defineProps<{
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}>();
</script>

<template>
  <section class="relative min-h-[90vh] w-full bg-[#f9f9f9] overflow-hidden flex items-center pt-20">
    <div class="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-20">
      <!-- Left Content -->
      <motion.div
        class="relative z-30"
        :initial="{ opacity: 0, x: -50 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ duration: 0.8, ease: 'easeOut' }"
      >
        <div class="flex items-center gap-4 mb-6">
          <span class="text-gray-900 font-bold tracking-tight">Meet With</span>
          <div class="h-[1px] w-16 bg-gray-300" />
        </div>
        
        <h1 class="text-[4rem] md:text-[5rem] lg:text-[6rem] leading-[0.9] font-serif mb-8 flex flex-col">
          <span class="text-[#8b8b45]">Sweet Elegant</span>
          <span class="text-gray-900 italic font-black">Fine Winery</span>
        </h1>
        
        <p class="max-w-md text-lg text-gray-700 mb-10 font-normal leading-relaxed">
          {{ description || "White dry wine of Appellation of Controlled Origin. Made from grape varieties cultivated in France." }}
        </p>

        <NuxtLink :to="buttonLink || '/shop'">
          <Button class="bg-[#8b8b45] hover:bg-[#7a7a3d] text-white border-none px-10 h-14 rounded-none transition-all duration-300 text-base font-bold">
            {{ buttonText || "View More" }}
          </Button>
        </NuxtLink>
      </motion.div>

      <!-- Right Content (Images) -->
      <div class="relative h-[400px] lg:h-[600px] flex items-center justify-center z-10">
         <!-- Main Bottle -->
         <motion.img 
           src="https://fse.catchthemes.com/drinkify/wp-content/themes/drinkify/assets/images/header-media-image.png"
           class="relative z-20 h-full object-contain"
           :initial="{ opacity: 0, scale: 0.8, y: 50 }"
           :animate="{ 
             opacity: 1, 
             scale: 1, 
             y: [0, -15, 0] 
           }"
           :transition="{ 
             opacity: { duration: 1, delay: 0.2 },
             scale: { duration: 1, delay: 0.2 },
             y: {
               duration: 4,
               repeat: Infinity,
               ease: 'easeInOut',
               delay: 1.2
             }
           }"
         />
         
         <!-- Grapes -->
         <motion.div 
           class="absolute bottom-0 left-0 lg:-left-12 z-30"
           :initial="{ opacity: 0, x: -30 }"
           :animate="{ opacity: 1, x: 0 }"
           :transition="{ duration: 1, delay: 0.5 }"
         >
           <img src="https://fse.catchthemes.com/drinkify/wp-content/themes/drinkify/assets/images/hero-img.jpg" class="w-32 h-32 lg:w-48 lg:h-48 rounded-full object-cover border-8 border-white shadow-2xl" />
         </motion.div>
      </div>
    </div>

    <!-- Background Decoration -->
    <div class="absolute top-0 right-0 w-1/3 h-full bg-[#f2f2f2] z-0" />
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

.font-serif {
  font-family: 'Playfair Display', serif;
}
</style>
