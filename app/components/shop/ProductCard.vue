<script setup lang="ts">
import { ShoppingCart } from "lucide-vue-next";
import type { Product, ProductVariant } from "~~/server/db/schema";

interface ProductWithRelations extends Product {
  category?: { id: string; title: string; slug: string } | null;
  variants?: ProductVariant[];
  images?: Array<{ url: string; alt: string | null }>;
  priceRange?: { min: number; max: number } | null;
}

const props = defineProps<{
  product: ProductWithRelations;
}>();

const { addToCart, isLoading } = useCart();

// Calculate price display
const priceDisplay = computed(() => {
  if (props.product.priceRange) {
    const { min, max } = props.product.priceRange;
    if (min === max) {
      return formatPrice(min);
    }
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  }

  if (props.product.variants && props.product.variants.length > 0) {
    const prices = props.product.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) {
      return formatPrice(min);
    }
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  }

  return null;
});

// Get first image or thumbnail
const imageUrl = computed(() => {
  if (props.product.images && props.product.images.length > 0) {
    return props.product.images[0].url;
  }
  return props.product.thumbnail || "/placeholder-product.jpg";
});

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

async function handleQuickAdd() {
  if (props.product.variants && props.product.variants.length > 0) {
    // If product has variants, navigate to product page
    navigateTo(`/shop/${props.product.slug}`);
    return;
  }
  // Otherwise, add directly
  await addToCart(props.product.id);
}
</script>

<template>
  <Card class="group overflow-hidden hover:shadow-lg transition-shadow">
    <NuxtLink :to="`/shop/${product.slug}`" class="block">
      <div class="aspect-square overflow-hidden bg-muted">
        <img
          :src="imageUrl"
          :alt="product.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </NuxtLink>

    <CardContent class="p-4">
      <div class="space-y-2">
        <NuxtLink
          v-if="product.category"
          :to="`/shop/category/${product.category.slug}`"
          class="text-xs text-muted-foreground hover:text-primary"
        >
          {{ product.category.title }}
        </NuxtLink>

        <NuxtLink :to="`/shop/${product.slug}`">
          <h3
            class="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors"
          >
            {{ product.title }}
          </h3>
        </NuxtLink>

        <div class="flex items-center justify-between gap-2">
          <span v-if="priceDisplay" class="font-semibold text-lg">
            {{ priceDisplay }}
          </span>

          <Button
            size="sm"
            variant="outline"
            class="shrink-0"
            :disabled="isLoading"
            @click.prevent="handleQuickAdd"
          >
            <ShoppingCart class="h-4 w-4" />
          </Button>
        </div>

        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge v-if="product.status === 'out_of_stock'" variant="destructive">
            Stokta Yok
          </Badge>
          <Badge
            v-else-if="product.variants && product.variants.length > 1"
            variant="secondary"
          >
            {{ product.variants.length }} Seçenek
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
