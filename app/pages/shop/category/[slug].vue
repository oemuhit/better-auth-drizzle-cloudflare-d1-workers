<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const slug = computed(() => route.params.slug as string);

// Fetch category
const { data: categoryData, error } = await useFetch(
  `/api/categories/${slug.value}`,
);

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Kategori bulunamadı",
  });
}

const category = computed(() => categoryData.value?.data);

useHead({
  title: computed(() =>
    category.value?.title ? `${category.value.title} | Mağaza` : "Kategori",
  ),
});

// Filters
const filters = ref({
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
});

const page = ref(1);

// Fetch products in this category
const { data: productsData, pending } = await useFetch("/api/products", {
  query: computed(() => ({
    page: page.value,
    limit: 12,
    categoryId: category.value?.id,
    search: filters.value.search || undefined,
    sortBy: filters.value.sortBy,
    sortOrder: filters.value.sortOrder,
  })),
  watch: [filters, page, category],
});

// Fetch all categories for sidebar
const { data: categoriesData } = await useFetch("/api/categories", {
  query: { parentOnly: true },
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
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <NuxtLink to="/" class="hover:text-foreground">Ana Sayfa</NuxtLink>
      <ChevronRight class="h-4 w-4" />
      <NuxtLink to="/shop" class="hover:text-foreground">Mağaza</NuxtLink>
      <template v-if="category?.parentCategory">
        <ChevronRight class="h-4 w-4" />
        <NuxtLink
          :to="`/shop/category/${category.parentCategory.slug}`"
          class="hover:text-foreground"
        >
          {{ category.parentCategory.title }}
        </NuxtLink>
      </template>
      <ChevronRight class="h-4 w-4" />
      <span class="text-foreground">{{ category?.title }}</span>
    </nav>

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar -->
      <aside class="w-full lg:w-64 shrink-0">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Kategoriler</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryNav :categories="categories" :active-category="slug" />
          </CardContent>
        </Card>
      </aside>

      <!-- Main Content -->
      <div class="flex-1">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold mb-2">{{ category?.title }}</h1>
          <p class="text-muted-foreground">
            {{ pagination?.total || 0 }} ürün bulundu
          </p>
        </div>

        <!-- Subcategories -->
        <div
          v-if="category?.subCategories && category.subCategories.length > 0"
          class="mb-6"
        >
          <h2 class="text-sm font-medium text-muted-foreground mb-3">
            Alt Kategoriler
          </h2>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="sub in category.subCategories"
              :key="sub.id"
              :to="`/shop/category/${sub.slug}`"
            >
              <Badge
                variant="outline"
                class="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                {{ sub.title }}
              </Badge>
            </NuxtLink>
          </div>
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
