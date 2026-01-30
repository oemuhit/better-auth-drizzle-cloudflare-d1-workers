<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";

defineProps<{
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
}>();
</script>

<template>
  <section
    class="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
  >
    <div class="container mx-auto px-4 py-16 lg:py-24">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Content -->
        <div class="space-y-6 text-center lg:text-left">
          <p class="text-sm font-medium text-primary uppercase tracking-wider">
            {{ subtitle || "Yeni Koleksiyon" }}
          </p>
          <h1
            class="text-4xl lg:text-6xl font-bold text-foreground leading-tight"
          >
            {{ title || "Yeni Sezon Koleksiyonu" }}
          </h1>
          <p class="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
            {{
              description ||
              "En son trendleri ve stilleri keşfedin. Yeni sezon ürünlerimizi inceleyin."
            }}
          </p>
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <NuxtLink :to="buttonLink || '/shop'">
              <Button size="lg" class="gap-2">
                {{ buttonText || "Alışverişe Başla" }}
                <ArrowRight class="h-4 w-4" />
              </Button>
            </NuxtLink>
          </div>
        </div>

        <!-- Image -->
        <div class="relative">
          <div class="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
            <img
              :src="
                imageUrl ||
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
              "
              alt="Hero"
              class="w-full h-full object-cover"
            />
          </div>
          <!-- Decorative elements -->
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"
          />
          <div
            class="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
          />
        </div>
      </div>
    </div>
  </section>
</template>
