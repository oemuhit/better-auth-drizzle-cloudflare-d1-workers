<script setup lang="ts">
import {
  ChevronRight,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  Pencil,
} from "lucide-vue-next";
import { useSession } from "~/lib/auth-client";

definePageMeta({
  layout: "default",
});

const { data: session } = await useSession(useFetch);

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
    product.value?.title ? `${product.value.title} | Shop` : "Ürün",
  ),
});

// Fetch related products (same category)
const { data: relatedProductsData } = await useFetch("/api/products", {
  query: computed(() => ({
    limit: 4,
    categoryId: product.value?.categoryId,
  })),
});

const relatedProducts = computed(() =>
  (relatedProductsData.value?.data || []).filter(
    (p: any) => p.id !== product.value?.id,
  ),
);

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
  const imgs: { url: string; alt: string | null }[] = [];
  const urls = new Set<string>();

  const addImage = (url: string | null | undefined, alt: string | null) => {
    if (url && !urls.has(url)) {
      urls.add(url);
      imgs.push({ url, alt });
    }
  };

  addImage(product.value?.thumbnail, product.value?.title ?? null);

  if (product.value?.images) {
    product.value.images.forEach((img: any) => addImage(img.url, img.alt));
  }

  if (product.value?.variants) {
    product.value.variants.forEach((v: any) =>
      addImage(v.image, product.value?.title ?? null),
    );
  }

  return imgs.length > 0
    ? imgs
    : [{ url: "/placeholder-product.avif", alt: "Placeholder" }];
});

// Switch image when variant changes
watch(selectedVariant, (newVariant) => {
  if (newVariant?.image) {
    const index = images.value.findIndex((img) => img.url === newVariant.image);
    if (index !== -1) {
      currentImageIndex.value = index;
    }
  }
});

const mainImage = computed(() => {
  return images.value[currentImageIndex.value] || images.value[0];
});

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

// Wishlist
const { isInWishlist, toggleWishlist } = useWishlist();
const inWishlist = computed(() =>
  product.value ? isInWishlist(product.value.id) : false,
);

function handleToggleWishlist() {
  if (product.value) {
    toggleWishlist(product.value);
  }
}

// Mock rating
const rating = 4;
const reviewCount = 12;
</script>

<template>
  <div>
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
        <span class="text-foreground line-clamp-1">{{ product?.title }}</span>
      </nav>

      <div v-if="product" class="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <!-- Images -->
        <div class="space-y-4">
          <!-- Main Image -->
          <div
            class="aspect-square rounded-2xl overflow-hidden bg-muted relative group"
          >
            <NuxtImg
              v-if="mainImage"
              :src="mainImage.url"
              :alt="mainImage.alt || (product?.title ?? '')"
              preset="large"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <!-- Wishlist Button -->
            <Button
              variant="secondary"
              size="icon"
              class="absolute top-4 right-4 rounded-full shadow-lg"
              :class="{ 'text-red-500': inWishlist }"
              @click="handleToggleWishlist"
            >
              <Heart class="h-5 w-5" :class="{ 'fill-current': inWishlist }" />
            </Button>
          </div>

          <!-- Thumbnails -->
          <div v-if="images.length > 1" class="flex gap-3 overflow-x-auto pb-2">
            <button
              v-for="(image, index) in images"
              :key="index"
              class="shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all"
              :class="[
                currentImageIndex === index
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground',
              ]"
              @click="currentImageIndex = index"
            >
              <NuxtImg
                :src="image.url"
                preset="thumbnail"
                :alt="image.alt || ''"
                class="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="space-y-6">
          <!-- Category & Title -->
          <div>
            <NuxtLink
              v-if="product.category"
              :to="`/shop/category/${product.category.slug}`"
              class="text-sm text-primary hover:underline"
            >
              {{ product.category.title }}
            </NuxtLink>
            <h1
              class="text-3xl lg:text-4xl font-bold mt-2 flex items-center gap-3"
            >
              {{ product.title }}
              <NuxtLink
                v-if="session?.user"
                :to="`/admin/products/${product.id}/edit`"
                class="text-muted-foreground hover:text-primary transition-colors"
                title="Ürünü Düzenle"
              >
                <Pencil class="h-6 w-6" />
              </NuxtLink>
            </h1>
          </div>

          <!-- Rating -->
          <div class="flex items-center gap-2">
            <div class="flex">
              <Star
                v-for="i in 5"
                :key="i"
                class="h-5 w-5"
                :class="
                  i <= rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200'
                "
              />
            </div>
            <span class="text-sm text-muted-foreground">
              ({{ reviewCount }} değerlendirme)
            </span>
          </div>

          <!-- Price -->
          <div class="flex items-baseline gap-3">
            <span
              v-if="selectedVariant"
              class="text-3xl font-bold text-primary"
            >
              {{ formatPrice(selectedVariant.price) }}
            </span>
            <span
              v-else-if="product.priceRange"
              class="text-3xl font-bold text-primary"
            >
              {{
                product.priceRange.min === product.priceRange.max
                  ? formatPrice(product.priceRange.min)
                  : `${formatPrice(product.priceRange.min)} - ${formatPrice(product.priceRange.max)}`
              }}
            </span>
            <span
              v-else-if="product.basePrice !== null"
              class="text-3xl font-bold text-primary"
            >
              {{ formatPrice(product.basePrice) }}
            </span>
            <span
              v-if="
                selectedVariant?.compareAtPrice &&
                selectedVariant.compareAtPrice > selectedVariant.price
              "
              class="text-xl text-muted-foreground line-through"
            >
              {{ formatPrice(selectedVariant.compareAtPrice) }}
            </span>
            <Badge v-if="selectedVariant?.compareAtPrice" variant="destructive">
              İndirim
            </Badge>
          </div>

          <!-- Description Short -->
          <p
            v-if="product.shortDescription || product.description"
            class="text-muted-foreground line-clamp-3"
          >
            {{
              product.shortDescription ||
              product.description?.replace(/<[^>]*>?/gm, "") ||
              ""
            }}
          </p>

          <!-- Variants -->
          <div v-if="product.variants && product.variants.length > 0">
            <ProductVariantSelect
              v-model="selectedVariantId"
              :variants="product.variants as any"
              :variant-attributes="product.variantAttributes as any"
            />
          </div>

          <!-- Stock / Status -->
          <div v-if="product" class="flex flex-wrap items-center gap-2">
            <Badge
              v-if="product.status === 'backordered'"
              variant="secondary"
              class="bg-amber-500/20 text-amber-800 dark:text-amber-200"
            >
              Ön sipariş
            </Badge>
            <Badge
              v-else-if="product.status === 'out_of_stock'"
              variant="secondary"
            >
              Stokta yok
            </Badge>
            <template v-else>
              <div
                class="h-3 w-3 rounded-full"
                :class="product.inStock ? 'bg-green-500' : 'bg-red-500'"
              />
              <span
                :class="product.inStock ? 'text-green-600' : 'text-red-600'"
              >
                {{ product.inStock ? "Stokta" : "Stokta Yok" }}
              </span>
              <span
                v-if="product.inStock"
                class="text-sm text-muted-foreground"
              >
                ({{ product.totalStock }} adet)
              </span>
            </template>
          </div>

          <!-- Add to Cart -->
          <div class="pt-4">
            <AddToCartButton
              :product-id="product.id"
              :variant-id="selectedVariantId"
              :disabled="
                product.status === 'out_of_stock' ||
                !product.inStock ||
                (product.variants?.length > 0 && !selectedVariantId)
              "
              size="lg"
              full-width
            />
          </div>

          <div v-if="product.description">
            <TiptapContent :content="product.description" />
          </div>

          <!-- Features -->
          <div class="grid grid-cols-3 gap-4 pt-4">
            <div
              class="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl"
            >
              <Truck class="h-5 w-5 text-primary mb-2" />
              <span class="text-xs font-medium">Ücretsiz Kargo</span>
            </div>
            <div
              class="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl"
            >
              <ShieldCheck class="h-5 w-5 text-primary mb-2" />
              <span class="text-xs font-medium">Güvenli Ödeme</span>
            </div>
            <div
              class="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl"
            >
              <RotateCcw class="h-5 w-5 text-primary mb-2" />
              <span class="text-xs font-medium">30 Gün İade</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Details Tabs -->
      <div v-if="product" class="mt-16">
        <Tabs default-value="description" class="w-full">
          <TabsList class="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="description">Açıklama</TabsTrigger>
            <TabsTrigger value="reviews">Değerlendirmeler</TabsTrigger>
          </TabsList>
          <TabsContent value="description" class="mt-6">
            <div v-if="product.description">
              <TiptapContent :content="product.description" />
            </div>
            <div v-else class="text-muted-foreground">
              Bu ürün için detaylı açıklama bulunmuyor.
            </div>
          </TabsContent>
          <TabsContent value="reviews" class="mt-6">
            <div class="text-center py-8 text-muted-foreground">
              Henüz değerlendirme yok.
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <!-- Related Products -->
      <div v-if="relatedProducts.length > 0" class="mt-16">
        <h2 class="text-2xl font-bold mb-6">Benzer Ürünler</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <ProductCard
            v-for="p in relatedProducts.slice(0, 4)"
            :key="p.id"
            :product="p"
          />
        </div>
      </div>
    </div>
  </div>
</template>
