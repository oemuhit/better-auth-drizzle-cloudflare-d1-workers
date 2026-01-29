<script setup lang="ts">
import type { ProductVariant } from "~~/server/db/schema";

const props = defineProps<{
  variants: ProductVariant[];
  colors?: string[];
  sizes?: string[];
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
  variantChange: [variant: ProductVariant | undefined];
}>();

const selectedColor = ref<string | null>(null);
const selectedSize = ref<string | null>(null);

// Get unique colors and sizes from variants
const availableColors = computed(() => {
  if (props.colors && props.colors.length > 0) return props.colors;
  const colors = new Set(props.variants.map((v) => v.color).filter(Boolean));
  return Array.from(colors) as string[];
});

const availableSizes = computed(() => {
  if (props.sizes && props.sizes.length > 0) return props.sizes;
  const sizes = new Set(props.variants.map((v) => v.size).filter(Boolean));
  return Array.from(sizes) as string[];
});

// Find matching variant
const selectedVariant = computed(() => {
  return props.variants.find((v) => {
    const colorMatch = !selectedColor.value || v.color === selectedColor.value;
    const sizeMatch = !selectedSize.value || v.size === selectedSize.value;
    return colorMatch && sizeMatch;
  });
});

// Check if a color/size combination is available
function isColorAvailable(color: string) {
  return props.variants.some((v) => {
    const colorMatch = v.color === color;
    const sizeMatch = !selectedSize.value || v.size === selectedSize.value;
    return colorMatch && sizeMatch && v.stockQuantity > 0;
  });
}

function isSizeAvailable(size: string) {
  return props.variants.some((v) => {
    const colorMatch = !selectedColor.value || v.color === selectedColor.value;
    const sizeMatch = v.size === size;
    return colorMatch && sizeMatch && v.stockQuantity > 0;
  });
}

// Watch for changes
watch(selectedVariant, (variant) => {
  emit("update:modelValue", variant?.id);
  emit("variantChange", variant);
});

// Initialize with first available variant
onMounted(() => {
  if (props.variants.length > 0) {
    const firstAvailable =
      props.variants.find((v) => v.stockQuantity > 0) || props.variants[0];
    if (firstAvailable.color) selectedColor.value = firstAvailable.color;
    if (firstAvailable.size) selectedSize.value = firstAvailable.size;
  }
});

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Color Selection -->
    <div v-if="availableColors.length > 0">
      <label class="text-sm font-medium mb-2 block">
        Renk: {{ selectedColor || "Seçiniz" }}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="color in availableColors"
          :key="color"
          type="button"
          class="px-3 py-1.5 text-sm border rounded-md transition-colors"
          :class="[
            selectedColor === color
              ? 'border-primary bg-primary text-primary-foreground'
              : isColorAvailable(color)
                ? 'border-border hover:border-primary'
                : 'border-border opacity-50 cursor-not-allowed line-through',
          ]"
          :disabled="!isColorAvailable(color)"
          @click="selectedColor = color"
        >
          {{ color }}
        </button>
      </div>
    </div>

    <!-- Size Selection -->
    <div v-if="availableSizes.length > 0">
      <label class="text-sm font-medium mb-2 block">
        Beden: {{ selectedSize || "Seçiniz" }}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="size in availableSizes"
          :key="size"
          type="button"
          class="px-3 py-1.5 text-sm border rounded-md transition-colors min-w-[40px]"
          :class="[
            selectedSize === size
              ? 'border-primary bg-primary text-primary-foreground'
              : isSizeAvailable(size)
                ? 'border-border hover:border-primary'
                : 'border-border opacity-50 cursor-not-allowed line-through',
          ]"
          :disabled="!isSizeAvailable(size)"
          @click="selectedSize = size"
        >
          {{ size }}
        </button>
      </div>
    </div>

    <!-- Selected Variant Info -->
    <div v-if="selectedVariant" class="pt-2 border-t">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground"
          >SKU: {{ selectedVariant.sku || "-" }}</span
        >
        <span
          :class="[
            selectedVariant.stockQuantity > 0
              ? 'text-green-600'
              : 'text-red-600',
          ]"
        >
          {{
            selectedVariant.stockQuantity > 0
              ? `${selectedVariant.stockQuantity} adet stokta`
              : "Stokta yok"
          }}
        </span>
      </div>
      <div class="mt-2">
        <span class="text-2xl font-bold">{{
          formatPrice(selectedVariant.price)
        }}</span>
        <span
          v-if="
            selectedVariant.compareAtPrice &&
            selectedVariant.compareAtPrice > selectedVariant.price
          "
          class="ml-2 text-muted-foreground line-through"
        >
          {{ formatPrice(selectedVariant.compareAtPrice) }}
        </span>
      </div>
    </div>
  </div>
</template>
