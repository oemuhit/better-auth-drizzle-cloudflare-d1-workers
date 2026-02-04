<script setup lang="ts">
import { ChevronRight, Filter, X } from "lucide-vue-next";

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
    category.value?.title ? `${category.value.title} | Shop` : "Kategori",
  ),
});

// Filters
const filters = ref({
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
});

const page = ref(1);
const showFilters = ref(false);

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
  <div>
    <!-- Category Header with Background -->
    <div class="bg-muted/30 border-b">
      <div class="container mx-auto px-4 py-8">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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

        <h1 class="text-3xl font-bold">{{ category?.title }}</h1>
        <p class="text-muted-foreground mt-1">
          {{ pagination?.total || 0 }} ürün listeleniyor
        </p>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar (Desktop) -->
        <aside class="hidden lg:block w-64 shrink-0">
          <div class="sticky top-24 space-y-6">
            <!-- Categories -->
            <div>
              <h3 class="font-semibold mb-4">Kategoriler</h3>
              <ul class="space-y-2">
                <li>
                  <NuxtLink
                    to="/shop"
                    class="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Tüm Ürünler
                  </NuxtLink>
                </li>
                <li v-for="cat in categories" :key="cat.id">
                  <NuxtLink
                    :to="`/shop/category/${cat.slug}`"
                    class="text-sm transition-colors"
                    :class="
                      cat.slug === slug
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    "
                  >
                    {{ cat.title }}
                  </NuxtLink>
                </li>
              </ul>
            </div>

            <!-- Subcategories -->
            <div
              v-if="
                category?.subCategories && category.subCategories.length > 0
              "
            >
              <Separator class="mb-6" />
              <h3 class="font-semibold mb-4">Alt Kategoriler</h3>
              <ul class="space-y-2">
                <li v-for="sub in category.subCategories" :key="sub.id">
                  <NuxtLink
                    :to="`/shop/category/${sub.slug}`"
                    class="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {{ sub.title }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Subcategories (Mobile/Tablet) -->
          <div
            v-if="category?.subCategories && category.subCategories.length > 0"
            class="lg:hidden mb-6"
          >
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

          <!-- Top Bar -->
          <div
            class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6"
          >
            <!-- Mobile Filter Toggle -->
            <Button
              variant="outline"
              class="lg:hidden"
              @click="showFilters = !showFilters"
            >
              <Filter class="h-4 w-4 mr-2" />
              Filtreler
            </Button>

            <!-- Search & Sort -->
            <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Input
                v-model="filters.search"
                placeholder="Ürün ara..."
                class="w-full sm:w-64"
              />
              <Select v-model="filters.sortBy">
                <SelectTrigger class="w-full sm:w-48">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">En Yeni</SelectItem>
                  <SelectItem value="price">Fiyat</SelectItem>
                  <SelectItem value="title">İsim</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Mobile Filters -->
          <Transition
            enter-active-class="transition-all duration-300"
            enter-from-class="opacity-0 -translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-4"
          >
            <div
              v-if="showFilters"
              class="lg:hidden mb-6 p-4 bg-muted/30 rounded-lg"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold">Filtreler</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="showFilters = false"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
              <div class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium mb-2">Kategoriler</h4>
                  <div class="flex flex-wrap gap-2">
                    <NuxtLink to="/shop">
                      <Badge
                        variant="outline"
                        class="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      >
                        Tümü
                      </Badge>
                    </NuxtLink>
                    <NuxtLink
                      v-for="cat in categories"
                      :key="cat.id"
                      :to="`/shop/category/${cat.slug}`"
                    >
                      <Badge
                        :variant="cat.slug === slug ? 'default' : 'outline'"
                        class="cursor-pointer"
                      >
                        {{ cat.title }}
                      </Badge>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Loading State -->
          <div
            v-if="pending"
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            <div
              v-for="i in 8"
              :key="i"
              class="aspect-square rounded-xl bg-muted animate-pulse"
            />
          </div>

          <!-- Products Grid -->
          <div
            v-else-if="products.length > 0"
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            <DrinkifyProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
            />
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-16">
            <p class="text-muted-foreground">Bu kategoride ürün bulunamadı.</p>
            <NuxtLink to="/shop">
              <Button variant="outline" class="mt-4"> Tüm Ürünleri Gör </Button>
            </NuxtLink>
          </div>

          <!-- Pagination -->
          <div
            v-if="pagination && pagination.totalPages > 1"
            class="flex justify-center gap-2 mt-12"
          >
            <Button
              variant="outline"
              :disabled="!pagination.hasPrev"
              @click="page--"
            >
              Önceki
            </Button>
            <div class="flex items-center gap-1">
              <Button
                v-for="p in Math.min(pagination.totalPages, 5)"
                :key="p"
                :variant="p === pagination.page ? 'default' : 'outline'"
                size="icon"
                @click="page = p"
              >
                {{ p }}
              </Button>
            </div>
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
  </div>
</template>
