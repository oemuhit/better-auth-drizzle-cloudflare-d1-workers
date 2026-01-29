<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";
import type { Category } from "~~/server/db/schema";

interface CategoryWithSubs extends Category {
  subCategories?: Category[];
}

defineProps<{
  categories: CategoryWithSubs[];
  activeCategory?: string;
}>();
</script>

<template>
  <nav class="space-y-1">
    <NuxtLink
      to="/shop"
      class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
      :class="[
        !activeCategory
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      ]"
    >
      Tüm Ürünler
    </NuxtLink>

    <div v-for="category in categories" :key="category.id">
      <NuxtLink
        :to="`/shop/category/${category.slug}`"
        class="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors"
        :class="[
          activeCategory === category.slug
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        ]"
      >
        {{ category.title }}
        <ChevronRight
          v-if="category.subCategories && category.subCategories.length > 0"
          class="h-4 w-4"
        />
      </NuxtLink>

      <!-- Subcategories -->
      <div
        v-if="category.subCategories && category.subCategories.length > 0"
        class="ml-4 mt-1 space-y-1"
      >
        <NuxtLink
          v-for="sub in category.subCategories"
          :key="sub.id"
          :to="`/shop/category/${sub.slug}`"
          class="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors"
          :class="[
            activeCategory === sub.slug
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          ]"
        >
          {{ sub.title }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
