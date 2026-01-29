<script setup lang="ts">
import { ShoppingCart, Check, Loader2 } from "lucide-vue-next";

const props = defineProps<{
  productId: string;
  variantId?: string;
  disabled?: boolean;
  size?: "default" | "sm" | "lg";
  fullWidth?: boolean;
}>();

const { addToCart, isLoading } = useCart();

const added = ref(false);

async function handleAddToCart() {
  const success = await addToCart(props.productId, props.variantId);
  if (success) {
    added.value = true;
    setTimeout(() => {
      added.value = false;
    }, 2000);
  }
}
</script>

<template>
  <Button
    :size="size"
    :disabled="disabled || isLoading"
    :class="[fullWidth ? 'w-full' : '']"
    @click="handleAddToCart"
  >
    <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
    <Check v-else-if="added" class="h-4 w-4 mr-2" />
    <ShoppingCart v-else class="h-4 w-4 mr-2" />
    {{ added ? "Sepete Eklendi" : "Sepete Ekle" }}
  </Button>
</template>
