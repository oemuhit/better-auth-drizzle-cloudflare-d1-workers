<script setup lang="ts">
import { Minus, Plus, X } from "lucide-vue-next";
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

  const previousQuantity = localQuantity.value;
  localQuantity.value = newQuantity;

  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(async () => {
    try {
      await updateQuantity(props.item.id, newQuantity);
    } catch (error) {
      // Rollback to previous quantity on error
      localQuantity.value = previousQuantity;
    }
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
  if (props.item.product?.images && props.item.product.images.length > 0) {
    return props.item.product.images[0].url;
  }
  return props.item.product?.thumbnail || "/placeholder-product.avif";
});

// Get variant info
const variantInfo = computed(() => {
  if (!props.item.productVariant?.attributes) return null;
  const parts = Object.values(props.item.productVariant.attributes).filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" / ") : null;
});
</script>

<template>
  <div class="flex gap-4 p-4" :class="[compact ? '' : 'first:pt-4 last:pb-4']">
    <!-- Image -->
    <NuxtLink :to="`/shop/${item.product.slug}`" class="shrink-0">
      <div
        class="rounded-lg overflow-hidden bg-muted"
        :class="[compact ? 'w-16 h-16' : 'w-24 h-24']"
      >
        <NuxtImg
          :src="imageUrl"
          preset="thumbnail"
          :alt="item.product.title"
          class="w-full h-full object-cover"
        />
      </div>
    </NuxtLink>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div>
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
        </div>

        <!-- Remove Button -->
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ürünü kaldır"
          class="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          :disabled="isLoading"
          @click="handleRemove"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-end justify-between mt-3">
        <!-- Quantity Controls -->
        <div class="flex items-center border rounded-full">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Miktarı azalt"
            class="h-8 w-8 rounded-full"
            :disabled="isLoading || localQuantity <= 1"
            @click="handleQuantityChange(localQuantity - 1)"
          >
            <Minus class="h-3 w-3" />
          </Button>
          <span class="w-8 text-center text-sm font-medium">{{
            localQuantity
          }}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Miktarı artır"
            class="h-8 w-8 rounded-full"
            :disabled="isLoading"
            @click="handleQuantityChange(localQuantity + 1)"
          >
            <Plus class="h-3 w-3" />
          </Button>
        </div>

        <!-- Price -->
        <div class="text-right">
          <p class="text-sm text-muted-foreground">
            {{ formatPrice(item.price) }} x {{ localQuantity }}
          </p>
          <p class="font-semibold" :class="[compact ? 'text-sm' : 'text-lg']">
            {{ formatPrice(item.itemTotal) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
