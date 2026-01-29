<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const slug = computed(() => route.params.slug as string);

// Fetch product
const { data: productData, error } = await useFetch(
  `/api/products/${slug.value}`,
);

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Ürün bulunamadı",
  });
}

const product = computed(() => productData.value?.data);

useHead({
  title: computed(() =>
    product.value?.title ? `${product.value.title} | Mağaza` : "Ürün",
  ),
});

// Selected variant
const selectedVariantId = ref<string>();
const selectedVariant = computed(() => {
  if (!product.value?.variants) return null;
  return product.value.variants.find(
    (v: any) => v.id === selectedVariantId.value,
  );
});

// Current image
const currentImageIndex = ref(0);
const images = computed(() => {
  const imgs = [];
  if (product.value?.thumbnail) {
    imgs.push({ url: product.value.thumbnail, alt: product.value.title });
  }
  if (product.value?.images) {
    imgs.push(...product.value.images);
  }
  return imgs.length > 0
    ? imgs
    : [{ url: "/placeholder-product.jpg", alt: "Placeholder" }];
});

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <NuxtLink to="/" class="hover:text-foreground">Ana Sayfa</NuxtLink>
      <ChevronRight class="h-4 w-4" />
      <NuxtLink to="/shop" class="hover:text-foreground">Mağaza</NuxtLink>
      <template v-if="product?.category">
        <ChevronRight class="h-4 w-4" />
        <NuxtLink
          :to="`/shop/category/${product.category.slug}`"
          class="hover:text-foreground"
        >
          {{ product.category.title }}
        </NuxtLink>
      </template>
      <ChevronRight class="h-4 w-4" />
      <span class="text-foreground">{{ product?.title }}</span>
    </nav>

    <div v-if="product" class="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <!-- Images -->
      <div class="space-y-4">
        <!-- Main Image -->
        <div class="aspect-square rounded-lg overflow-hidden bg-muted">
          <img
            :src="images[currentImageIndex].url"
            :alt="images[currentImageIndex].alt || product.title"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Thumbnails -->
        <div v-if="images.length > 1" class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="(image, index) in images"
            :key="index"
            class="shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors"
            :class="[
              currentImageIndex === index
                ? 'border-primary'
                : 'border-transparent hover:border-muted-foreground',
            ]"
            @click="currentImageIndex = index"
          >
            <img
              :src="image.url"
              :alt="image.alt || ''"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      <!-- Product Info -->
      <div class="space-y-6">
        <div>
          <Badge v-if="product.category" variant="secondary" class="mb-2">
            {{ product.category.title }}
          </Badge>
          <h1 class="text-3xl font-bold">{{ product.title }}</h1>
        </div>

        <!-- Price -->
        <div v-if="selectedVariant">
          <span class="text-3xl font-bold">{{
            formatPrice(selectedVariant.price)
          }}</span>
          <span
            v-if="
              selectedVariant.compareAtPrice &&
              selectedVariant.compareAtPrice > selectedVariant.price
            "
            class="ml-2 text-xl text-muted-foreground line-through"
          >
            {{ formatPrice(selectedVariant.compareAtPrice) }}
          </span>
        </div>
        <div v-else-if="product.priceRange">
          <span class="text-3xl font-bold">
            {{
              product.priceRange.min === product.priceRange.max
                ? formatPrice(product.priceRange.min)
                : `${formatPrice(product.priceRange.min)} - ${formatPrice(product.priceRange.max)}`
            }}
          </span>
        </div>

        <!-- Status -->
        <div class="flex items-center gap-2">
          <Badge :variant="product.inStock ? 'default' : 'destructive'">
            {{ product.inStock ? "Stokta" : "Stokta Yok" }}
          </Badge>
          <span class="text-sm text-muted-foreground">
            {{ product.totalStock }} adet mevcut
          </span>
        </div>

        <!-- Variants -->
        <div v-if="product.variants && product.variants.length > 0">
          <ProductVariantSelect
            v-model="selectedVariantId"
            :variants="product.variants"
            :colors="product.colors"
            :sizes="product.sizes"
          />
        </div>

        <!-- Add to Cart -->
        <div class="pt-4">
          <AddToCartButton
            :product-id="product.id"
            :variant-id="selectedVariantId"
            :disabled="
              !product.inStock ||
              (product.variants?.length > 0 && !selectedVariantId)
            "
            size="lg"
            full-width
          />
        </div>

        <!-- Description -->
        <Separator />
        <div>
          <h2 class="font-semibold mb-2">Ürün Açıklaması</h2>
          <div
            v-if="product.description"
            class="prose prose-sm max-w-none text-muted-foreground"
            v-html="product.description"
          />
          <p v-else class="text-muted-foreground">
            Bu ürün için açıklama bulunmuyor.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
