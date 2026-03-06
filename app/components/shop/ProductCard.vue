<script setup lang="ts">
import { ShoppingCart, Heart, Star } from "lucide-vue-next";

interface ProductVariant {
  id: string;
  price: number;
  compareAtPrice?: number | null;
  color?: string | null;
  size?: string | null;
  stockQuantity: number;
}

interface ProductWithRelations {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail?: string | null;
  status: string;
  category?: { id: string; title: string; slug: string } | null;
  variants?: ProductVariant[];
  images?: Array<{ url: string; alt: string | null }>;
  priceRange?: { min: number; max: number } | null;
}

const props = defineProps<{
  product: ProductWithRelations;
}>();

const { addToCart, isLoading } = useCart();
const { isInWishlist, toggleWishlist } = useWishlist();

// Check if in wishlist
const inWishlist = computed(() => isInWishlist(props.product.id));

function handleToggleWishlist() {
  toggleWishlist(props.product);
}

// Calculate prices
const prices = computed(() => {
  if (props.product.variants && props.product.variants.length > 0) {
    const regularPrices = props.product.variants.map((v) => v.price);
    const comparePrices = props.product.variants
      .filter((v) => v.compareAtPrice)
      .map((v) => v.compareAtPrice as number);

    const minPrice = Math.min(...regularPrices);
    const maxPrice = Math.max(...regularPrices);
    const compareAtPrice =
      comparePrices.length > 0 ? Math.max(...comparePrices) : null;

    return {
      min: minPrice,
      max: maxPrice,
      compareAtPrice,
      hasDiscount: compareAtPrice && compareAtPrice > minPrice,
      discountPercent: compareAtPrice
        ? Math.round(((compareAtPrice - minPrice) / compareAtPrice) * 100)
        : 0,
    };
  }

  if (props.product.priceRange) {
    return {
      min: props.product.priceRange.min,
      max: props.product.priceRange.max,
      compareAtPrice: null,
      hasDiscount: false,
      discountPercent: 0,
    };
  }

  return null;
});

// Price display
const priceDisplay = computed(() => {
  if (!prices.value) return null;
  const { min, max } = prices.value;
  if (min === max) {
    return formatPrice(min);
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`;
});

// Get first image or thumbnail
const imageUrl = computed(() => {
  const firstImage = props.product.images?.[0];
  if (firstImage) {
    return firstImage.url;
  }
  return props.product.thumbnail || "/placeholder-product.avif";
});

// Hover image (second image if exists)
const hoverImageUrl = computed(() => {
  const secondImage = props.product.images?.[1];
  if (secondImage) {
    return secondImage.url;
  }
  return null;
});

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

async function handleQuickAdd() {
  if (props.product.variants && props.product.variants.length > 1) {
    navigateTo(`/shop/${props.product.slug}`);
    return;
  }
  await addToCart(props.product.id);
}

// Mock rating - in real app this would come from the product data
const rating = computed(() => Math.floor(Math.random() * 2) + 4);
const reviewCount = computed(() => Math.floor(Math.random() * 10));
</script>

<template>
  <div class="group relative">
    <!-- Image Container -->
    <NuxtLink
      :to="`/shop/${product.slug}`"
      class="block relative aspect-square overflow-hidden rounded-xl bg-muted"
    >
      <!-- Main Image -->
      <NuxtImg
        :src="imageUrl"
        preset="thumbnail"
        :alt="product.title"
        class="w-full h-full object-cover transition-all duration-500"
        :class="{ 'group-hover:opacity-0': hoverImageUrl }"
      />
      <!-- Hover Image -->
      <NuxtImg
        v-if="hoverImageUrl"
        :src="hoverImageUrl"
        preset="thumbnail"
        :alt="product.title"
        class="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100"
      />

      <!-- Sale Badge -->
      <div
        v-if="prices?.hasDiscount"
        class="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded"
      >
        -{{ prices.discountPercent }}%
      </div>

      <!-- Ön sipariş / Stok durumu badge (sol alt) -->
      <div
        v-if="product.status === 'backordered'"
        class="absolute bottom-3 left-3 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded"
      >
        Ön sipariş
      </div>
      <div
        v-else-if="product.status === 'out_of_stock'"
        class="absolute bottom-3 left-3 bg-muted-foreground/90 text-white text-xs font-medium px-2 py-1 rounded"
      >
        Stokta yok
      </div>

      <!-- Quick Actions -->
      <div
        class="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
      >
        <Button
          size="icon"
          aria-label="Hızlı Ekle"
          variant="secondary"
          class="h-9 w-9 rounded-full shadow-lg"
          @click.prevent="handleQuickAdd"
          :disabled="isLoading || product.status === 'out_of_stock'"
        >
          <ShoppingCart class="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          aria-label="Favorilere Ekle/Çıkar"
          variant="secondary"
          class="h-9 w-9 rounded-full shadow-lg"
          :class="{ 'text-red-500': inWishlist }"
          @click.prevent="handleToggleWishlist"
        >
          <Heart class="h-4 w-4" :class="{ 'fill-current': inWishlist }" />
        </Button>
      </div>

      <!-- Stokta yok overlay (tıklanabilir ama sepete eklenemez) -->
      <div
        v-if="product.status === 'out_of_stock'"
        class="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"
      >
        <span class="bg-white text-black px-3 py-1.5 rounded font-medium text-sm">
          Stokta yok
        </span>
      </div>
    </NuxtLink>

    <!-- Product Info -->
    <div class="mt-4 space-y-2">
      <!-- Rating -->
      <div class="flex items-center gap-1">
        <div class="flex">
          <Star
            v-for="i in 5"
            :key="i"
            class="h-3.5 w-3.5"
            :class="
              i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
            "
          />
        </div>
        <span class="text-xs text-muted-foreground">({{ reviewCount }})</span>
      </div>

      <!-- Title -->
      <NuxtLink :to="`/shop/${product.slug}`">
        <h3
          class="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors"
        >
          {{ product.title }}
        </h3>
      </NuxtLink>

      <!-- Price -->
      <div class="flex items-center gap-2">
        <span v-if="priceDisplay" class="font-semibold text-lg text-primary">
          {{ priceDisplay }}
        </span>
        <span
          v-if="prices?.hasDiscount && prices.compareAtPrice"
          class="text-sm text-muted-foreground line-through"
        >
          {{ formatPrice(prices.compareAtPrice) }}
        </span>
      </div>
    </div>
  </div>
</template>
