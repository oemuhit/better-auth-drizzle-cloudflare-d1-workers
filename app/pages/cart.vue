<script setup lang="ts">
import { ShoppingCart, Trash2 } from "lucide-vue-next";

definePageMeta({
  layout: "default",
});

useHead({
  title: "Sepetim",
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
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Sepetim</h1>

    <!-- Loading State -->
    <div v-if="isLoading && !cart" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
      />
    </div>

    <!-- Empty Cart -->
    <div v-else-if="isEmpty" class="text-center py-16">
      <ShoppingCart class="h-24 w-24 text-muted-foreground mx-auto mb-6" />
      <h2 class="text-2xl font-semibold mb-2">Sepetiniz boş</h2>
      <p class="text-muted-foreground mb-6">
        Alışverişe başlamak için ürün ekleyin
      </p>
      <Button size="lg">
        <NuxtLink to="/shop">Alışverişe Başla</NuxtLink>
      </Button>
    </div>

    <!-- Cart Content -->
    <div v-else class="grid lg:grid-cols-3 gap-8">
      <!-- Cart Items -->
      <div class="lg:col-span-2">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Sepet ({{ itemCount }} ürün)</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive"
              @click="clearCart"
            >
              <Trash2 class="h-4 w-4 mr-2" />
              Sepeti Temizle
            </Button>
          </CardHeader>
          <CardContent class="divide-y">
            <CartItem v-for="item in items" :key="item.id" :item="item" />
          </CardContent>
        </Card>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <Card class="sticky top-4">
          <CardHeader>
            <CardTitle>Sipariş Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <CartSummary :subtotal="subtotal" />
          </CardContent>
          <CardFooter class="flex flex-col gap-3">
            <Button class="w-full" size="lg">
              <NuxtLink to="/checkout" class="w-full">
                Siparişi Tamamla
              </NuxtLink>
            </Button>
            <Button variant="outline" class="w-full">
              <NuxtLink to="/shop" class="w-full">
                Alışverişe Devam Et
              </NuxtLink>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
