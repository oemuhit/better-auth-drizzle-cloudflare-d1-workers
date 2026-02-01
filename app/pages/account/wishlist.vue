<script setup lang="ts">
import {
  Heart,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Loader2,
} from "lucide-vue-next";

definePageMeta({
  layout: "account",
  middleware: "auth",
});

useHead({
  title: "Favorilerim | Hesabım",
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

onMounted(() => {
  fetchWishlist();
});

async function handleAddToCart(productId: string) {
  await addToCart(productId);
}

async function handleRemove(productId: string) {
  await removeFromWishlist(productId);
}

const isClearDialogOpen = ref(false);

async function handleClearAll() {
  await clearWishlist();
  isClearDialogOpen.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Favorilerim</h1>
        <p class="text-muted-foreground">{{ items.length }} ürün kaydedildi</p>
      </div>
      <Button
        v-if="!isEmpty"
        variant="ghost"
        size="sm"
        class="text-destructive hover:text-destructive hover:bg-destructive/10"
        @click="isClearDialogOpen = true"
      >
        <Trash2 class="h-4 w-4 mr-2" />
        Tümünü Temizle
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-16">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="text-center py-16 border-2 border-dashed rounded-xl">
      <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Heart class="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 class="text-xl font-semibold mb-2">Favorileriniz boş</h2>
      <p class="text-muted-foreground mb-6">Beğendiğiniz ürünleri favorilerinize ekleyin</p>
      <Button asChild class="gap-2">
        <NuxtLink to="/shop">
          Alışverişe Başla
          <ArrowRight class="h-4 w-4" />
        </NuxtLink>
      </Button>
    </div>

    <!-- Wishlist Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="group relative bg-background border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- Remove Button -->
        <Button
          variant="ghost"
          size="icon"
          class="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/80 hover:bg-white text-destructive shadow-sm"
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
            <h3 class="font-medium text-sm line-clamp-2 hover:text-primary transition-colors h-10">
              {{ item.product.title }}
            </h3>
          </NuxtLink>

          <div class="flex items-center justify-between pt-2">
            <span class="font-bold text-lg text-primary">
              {{ formatPrice(item.product.price) }}
            </span>

            <Button
              size="sm"
              variant="outline"
              class="h-8"
              :disabled="cartLoading"
              @click="handleAddToCart(item.productId)"
            >
              <ShoppingCart class="h-3.5 w-3.5 mr-1.5" />
              Ekle
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear Wishlist Confirmation Dialog -->
    <AlertDialog :open="isClearDialogOpen" @update:open="isClearDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tüm favorileri silmek istediğinize emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. İstek listenizdeki tüm ürünler silinecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isClearDialogOpen = false">İptal</AlertDialogCancel>
          <AlertDialogAction @click="handleClearAll" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Temizle
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
