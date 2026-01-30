<script setup lang="ts">
import {
  Heart,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Loader2,
} from "lucide-vue-next";

definePageMeta({
  layout: "default",
});

useHead({
  title: "Favorilerim | Shop",
});

const {
  items,
  isEmpty,
  isLoading,
  removeFromWishlist,
  clearWishlist,
  fetchWishlist,
  formatPrice,
} = useWishlist();

const { addToCart, isLoading: cartLoading } = useCart();

// Fetch wishlist on mount
onMounted(() => {
  fetchWishlist();
});

async function handleAddToCart(productId: string) {
  await addToCart(productId);
}

async function handleRemove(productId: string) {
  await removeFromWishlist(productId);
}

async function handleClearAll() {
  if (confirm("Tüm favorileri silmek istediğinize emin misiniz?")) {
    await clearWishlist();
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="bg-muted/30 border-b">
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold">Favorilerim</h1>
        <p class="text-muted-foreground mt-1">
          {{ items.length }} ürün kaydedildi
        </p>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-16">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
      </div>

      <!-- Empty State -->
      <div v-else-if="isEmpty" class="text-center py-16">
        <div
          class="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6"
        >
          <Heart class="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 class="text-2xl font-semibold mb-2">Favorileriniz boş</h2>
        <p class="text-muted-foreground mb-6">
          Beğendiğiniz ürünleri favorilerinize ekleyin
        </p>
        <NuxtLink to="/shop">
          <Button size="lg" class="gap-2">
            Alışverişe Başla
            <ArrowRight class="h-4 w-4" />
          </Button>
        </NuxtLink>
      </div>

      <!-- Wishlist Content -->
      <div v-else>
        <div class="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive"
            @click="handleClearAll"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            Tümünü Temizle
          </Button>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <div
            v-for="item in items"
            :key="item.id"
            class="group relative bg-background border rounded-xl overflow-hidden"
          >
            <!-- Remove Button -->
            <Button
              variant="ghost"
              size="icon"
              class="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/80 hover:bg-white text-destructive"
              @click="handleRemove(item.productId)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>

            <!-- Image -->
            <NuxtLink :to="`/shop/${item.product.slug}`">
              <div class="aspect-square overflow-hidden bg-muted">
                <img
                  :src="item.product.thumbnail || '/placeholder-product.jpg'"
                  :alt="item.product.title"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </NuxtLink>

            <!-- Info -->
            <div class="p-4 space-y-3">
              <NuxtLink :to="`/shop/${item.product.slug}`">
                <h3
                  class="font-medium line-clamp-2 hover:text-primary transition-colors"
                >
                  {{ item.product.title }}
                </h3>
              </NuxtLink>

              <div class="flex items-center justify-between">
                <span class="font-semibold text-lg text-primary">
                  {{ formatPrice(item.product.price) }}
                </span>

                <Button
                  size="sm"
                  :disabled="cartLoading"
                  @click="handleAddToCart(item.productId)"
                >
                  <ShoppingCart class="h-4 w-4 mr-2" />
                  Sepete Ekle
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
