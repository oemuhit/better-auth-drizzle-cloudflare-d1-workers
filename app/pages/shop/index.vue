<script setup lang="ts">
definePageMeta({
  layout: "default",
});

useHead({
  title: "Mağaza | Tüm Ürünler",
});

// Filters state
const filters = ref({
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
});

const page = ref(1);

// Fetch categories
const { data: categoriesData } = await useFetch("/api/categories", {
  query: { parentOnly: true },
});

// Fetch products
const {
  data: productsData,
  pending,
  refresh,
} = await useFetch("/api/products", {
  query: computed(() => ({
    page: page.value,
    limit: 12,
    search: filters.value.search || undefined,
    sortBy: filters.value.sortBy,
    sortOrder: filters.value.sortOrder,
  })),
  watch: [filters, page],
});

const categories = computed(() => categoriesData.value?.data || []);
const products = computed(() => productsData.value?.data || []);
const pagination = computed(() => productsData.value?.pagination);

// Watch filters and reset page
watch(
  filters,
  () => {
    page.value = 1;
  },
  { deep: true },
);
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar -->
      <aside class="w-full lg:w-64 shrink-0">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Kategoriler</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryNav :categories="categories" />
          </CardContent>
        </Card>
      </aside>

      <!-- Main Content -->
      <div class="flex-1">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold mb-2">Tüm Ürünler</h1>
          <p class="text-muted-foreground">
            {{ pagination?.total || 0 }} ürün bulundu
          </p>
        </div>

        <!-- Filters -->
        <div class="mb-6">
          <ProductFilters v-model="filters" />
        </div>

        <!-- Products Grid -->
        <ProductGrid :products="products" :loading="pending" />

        <!-- Pagination -->
        <div
          v-if="pagination && pagination.totalPages > 1"
          class="flex justify-center gap-2 mt-8"
        >
          <Button
            variant="outline"
            :disabled="!pagination.hasPrev"
            @click="page--"
          >
            Önceki
          </Button>
          <span class="flex items-center px-4">
            Sayfa {{ pagination.page }} / {{ pagination.totalPages }}
          </span>
          <Button
            variant="outline"
            :disabled="!pagination.hasNext"
            @click="page++"
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
