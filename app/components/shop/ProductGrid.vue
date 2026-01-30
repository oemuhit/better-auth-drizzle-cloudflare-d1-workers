<script setup lang="ts">
defineProps<{
  products: any[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}>();
</script>

<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="loading"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
    >
      <div v-for="i in 8" :key="i" class="space-y-4">
        <Skeleton class="aspect-square w-full rounded-xl" />
        <div class="space-y-2">
          <Skeleton class="h-4 w-16" />
          <Skeleton class="h-5 w-full" />
          <Skeleton class="h-6 w-24" />
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div
      v-else-if="products.length > 0"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <p class="text-muted-foreground">Ürün bulunamadı.</p>
    </div>
  </div>
</template>
