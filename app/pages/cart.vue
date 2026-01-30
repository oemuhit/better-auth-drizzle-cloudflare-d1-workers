<script setup lang="ts">
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft } from "lucide-vue-next";

definePageMeta({
  layout: "default",
});

useHead({
  title: "Sepetim | Shop",
});

const {
  cart,
  items,
  subtotal,
  itemCount,
  isEmpty,
  isLoading,
  fetchCart,
  clearCart,
  formatPrice,
} = useCart();

// Fetch cart on mount
onMounted(() => {
  fetchCart();
});
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="bg-muted/30 border-b">
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold">Sepetim</h1>
        <p class="text-muted-foreground mt-1">{{ itemCount }} ürün</p>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="isLoading && !cart" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        />
      </div>

      <!-- Empty Cart -->
      <div v-else-if="isEmpty" class="text-center py-16">
        <div
          class="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6"
        >
          <ShoppingCart class="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 class="text-2xl font-semibold mb-2">Sepetiniz boş</h2>
        <p class="text-muted-foreground mb-6">
          Alışverişe başlamak için ürün ekleyin
        </p>
        <NuxtLink to="/shop">
          <Button size="lg" class="gap-2">
            Alışverişe Başla
            <ArrowRight class="h-4 w-4" />
          </Button>
        </NuxtLink>
      </div>

      <!-- Cart Content -->
      <div v-else class="grid lg:grid-cols-3 gap-8">
        <!-- Cart Items -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Ürünler</h2>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              @click="clearCart"
            >
              <Trash2 class="h-4 w-4 mr-2" />
              Sepeti Temizle
            </Button>
          </div>

          <div class="bg-background border rounded-xl divide-y">
            <CartItem v-for="item in items" :key="item.id" :item="item" />
          </div>

          <NuxtLink
            to="/shop"
            class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft class="h-4 w-4" />
            Alışverişe Devam Et
          </NuxtLink>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-background border rounded-xl p-6 sticky top-24">
            <h2 class="text-lg font-semibold mb-4">Sipariş Özeti</h2>

            <div class="space-y-3 mb-6">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Ara Toplam</span>
                <span>{{ formatPrice(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Kargo</span>
                <span class="text-green-600">Ücretsiz</span>
              </div>
              <Separator />
              <div class="flex justify-between font-semibold">
                <span>Toplam</span>
                <span class="text-lg">{{ formatPrice(subtotal) }}</span>
              </div>
            </div>

            <NuxtLink to="/checkout" class="block">
              <Button class="w-full" size="lg">
                Siparişi Tamamla
                <ArrowRight class="h-4 w-4 ml-2" />
              </Button>
            </NuxtLink>

            <div class="mt-4 p-3 bg-muted/50 rounded-lg">
              <p class="text-xs text-muted-foreground text-center">
                Güvenli ödeme ile alışveriş yapın
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
