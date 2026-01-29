<script setup lang="ts">
import type { Product, ProductVariant } from "~~/server/db/schema";

interface ProductWithRelations extends Product {
  category?: { id: string; title: string; slug: string } | null;
  variants?: ProductVariant[];
  images?: Array<{ url: string; alt: string | null }>;
}

defineProps<{
  products: ProductWithRelations[];
  loading?: boolean;
}>();
</script>

<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <Card v-for="i in 8" :key="i" class="overflow-hidden">
        <Skeleton class="aspect-square w-full" />
        <CardContent class="p-4 space-y-3">
          <Skeleton class="h-3 w-16" />
          <Skeleton class="h-5 w-full" />
          <div class="flex justify-between">
            <Skeleton class="h-6 w-20" />
            <Skeleton class="h-8 w-8 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Products Grid -->
    <div
      v-else-if="products.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <p class="text-muted-foreground">Ürün bulunamadı.</p>
    </div>
  </div>
</template>
