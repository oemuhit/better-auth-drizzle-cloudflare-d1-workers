<script setup lang="ts">
import { Truck, ShieldCheck, CreditCard, Headphones } from "lucide-vue-next";

const features = [
  {
    icon: Truck,
    title: "Ücretsiz Kargo",
    description: "150₺ üzeri siparişlerde ücretsiz kargo",
  },
  {
    icon: ShieldCheck,
    title: "Güvenli Alışveriş",
    description: "30 gün içinde iade garantisi",
  },
  {
    icon: CreditCard,
    title: "Güvenli Ödeme",
    description: "256-bit SSL güvenli ödeme",
  },
  {
    icon: Headphones,
    title: "7/24 Destek",
    description: "Her zaman yanınızdayız",
  },
];
</script>

<template>
  <section class="border-y bg-muted/30">
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex flex-col items-center text-center gap-3"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
          >
            <component :is="feature.icon" class="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 class="font-semibold text-sm">{{ feature.title }}</h3>
            <p class="text-xs text-muted-foreground mt-1">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
