<script setup lang="ts">
import { Minus, Plus, Trash2 } from "lucide-vue-next";
import type { CartItem as CartItemType } from "~/composables/useCart";

const props = defineProps<{
  item: CartItemType;
  compact?: boolean;
}>();

const { updateQuantity, removeItem, isLoading, formatPrice } = useCart();

const localQuantity = ref(props.item.quantity);

// Sync local quantity with prop
watch(
  () => props.item.quantity,
  (newVal) => {
    localQuantity.value = newVal;
  },
);

// Debounce quantity updates
let updateTimeout: ReturnType<typeof setTimeout>;
async function handleQuantityChange(newQuantity: number) {
  if (newQuantity < 1) return;

  localQuantity.value = newQuantity;

  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(async () => {
    await updateQuantity(props.item.id, newQuantity);
  }, 500);
}

async function handleRemove() {
  await removeItem(props.item.id);
}

// Get image
const imageUrl = computed(() => {
  if (props.item.productVariant?.image) {
    return props.item.productVariant.image;
  }
  if (props.item.product.images && props.item.product.images.length > 0) {
    return props.item.product.images[0].url;
  }
  return "/placeholder-product.jpg";
});

// Get variant info
const variantInfo = computed(() => {
  if (!props.item.productVariant) return null;
  const parts = [];
  if (props.item.productVariant.color)
    parts.push(props.item.productVariant.color);
  if (props.item.productVariant.size)
    parts.push(props.item.productVariant.size);
  return parts.length > 0 ? parts.join(" / ") : null;
});
</script>

<template>
  <div class="flex gap-4" :class="[compact ? 'py-2' : 'py-4 border-b']">
    <!-- Image -->
    <NuxtLink :to="`/shop/${item.product.slug}`" class="shrink-0">
      <img
        :src="imageUrl"
        :alt="item.product.title"
        class="rounded-md object-cover"
        :class="[compact ? 'w-16 h-16' : 'w-20 h-20']"
      />
    </NuxtLink>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <NuxtLink
        :to="`/shop/${item.product.slug}`"
        class="font-medium text-foreground hover:text-primary line-clamp-2"
        :class="[compact ? 'text-sm' : '']"
      >
        {{ item.product.title }}
      </NuxtLink>

      <p v-if="variantInfo" class="text-sm text-muted-foreground mt-0.5">
        {{ variantInfo }}
      </p>

      <p class="font-semibold mt-1" :class="[compact ? 'text-sm' : '']">
        {{ formatPrice(item.price) }}
      </p>

      <!-- Quantity Controls -->
      <div class="flex items-center gap-2 mt-2">
        <div class="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :disabled="isLoading || localQuantity <= 1"
            @click="handleQuantityChange(localQuantity - 1)"
          >
            <Minus class="h-3 w-3" />
          </Button>
          <span class="w-8 text-center text-sm">{{ localQuantity }}</span>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :disabled="isLoading"
            @click="handleQuantityChange(localQuantity + 1)"
          >
            <Plus class="h-3 w-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-muted-foreground hover:text-destructive"
          :disabled="isLoading"
          @click="handleRemove"
        >
          <Trash2 class="h-4 w-4" />
        </Button>

        <span class="ml-auto font-semibold" :class="[compact ? 'text-sm' : '']">
          {{ formatPrice(item.itemTotal) }}
        </span>
      </div>
    </div>
  </div>
</template>
