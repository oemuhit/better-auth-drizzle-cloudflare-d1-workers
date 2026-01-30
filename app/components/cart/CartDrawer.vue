<script setup lang="ts">
import { ShoppingCart, X } from "lucide-vue-next";

const {
  cart,
  items,
  subtotal,
  itemCount,
  isEmpty,
  isLoading,
  fetchCart,
  formatPrice,
} = useCart();

const isOpen = defineModel<boolean>("open", { default: false });

// Fetch cart when drawer opens
watch(isOpen, async (open) => {
  if (open) {
    await fetchCart();
  }
});
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetTrigger as-child>
      <slot name="trigger">
        <Button variant="outline" size="icon" class="relative">
          <ShoppingCart class="h-5 w-5" />
          <span
            v-if="itemCount > 0"
            class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
          >
            {{ itemCount > 99 ? "99+" : itemCount }}
          </span>
        </Button>
      </slot>
    </SheetTrigger>

    <SheetContent class="w-full sm:max-w-lg flex flex-col">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2">
          <ShoppingCart class="h-5 w-5" />
          Sepetim
          <Badge v-if="itemCount > 0" variant="secondary">
            {{ itemCount }} ürün
          </Badge>
        </SheetTitle>
      </SheetHeader>

      <!-- Loading State -->
      <div
        v-if="isLoading && !cart"
        class="flex-1 flex items-center justify-center"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="isEmpty"
        class="flex-1 flex flex-col items-center justify-center text-center"
      >
        <ShoppingCart class="h-16 w-16 text-muted-foreground mb-4" />
        <h3 class="font-medium text-lg">Sepetiniz boş</h3>
        <p class="text-muted-foreground text-sm mt-1">
          Alışverişe başlamak için ürün ekleyin
        </p>
        <Button class="mt-4" @click="isOpen = false">
          <NuxtLink to="/shop">Alışverişe Başla</NuxtLink>
        </Button>
      </div>

      <!-- Cart Items -->
      <div v-else class="flex-1 overflow-auto py-4 space-y-4">
        <CartItem v-for="item in items" :key="item.id" :item="item" />
      </div>

      <!-- Footer -->
      <div v-if="!isEmpty" class="border-t pt-4 space-y-4 px-4">
        <CartSummary :subtotal="subtotal" />

        <div class="grid gap-2">
          <Button class="w-full" size="lg" @click="isOpen = false">
            <NuxtLink to="/checkout" class="w-full">
              Siparişi Tamamla
            </NuxtLink>
          </Button>
          <Button variant="outline" class="w-full" @click="isOpen = false">
            <NuxtLink to="/cart" class="w-full"> Sepeti Görüntüle </NuxtLink>
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
