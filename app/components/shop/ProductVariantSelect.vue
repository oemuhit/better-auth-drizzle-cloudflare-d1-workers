<script setup lang="ts">
import type {
  ProductVariant,
  VariantAttributeDefinition,
} from "~~/server/db/schema";

interface ExtendedProductVariant extends ProductVariant {
  attributes?: Record<string, string>;
}

const props = defineProps<{
  variants: ExtendedProductVariant[];
  variantAttributes?: Record<string, VariantAttributeDefinition>;
  // Legacy props for backwards compatibility
  colors?: string[];
  sizes?: string[];
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
  variantChange: [variant: ExtendedProductVariant | undefined];
}>();

// Selected attribute values
const selectedAttributes = ref<Record<string, string | null>>({});

// Get all attribute definitions (from variantAttributes or infer from variants)
const attributeDefinitions = computed(() => {
  if (
    props.variantAttributes &&
    Object.keys(props.variantAttributes).length > 0
  ) {
    return props.variantAttributes;
  }

  // Fallback: infer from variants (legacy color/size support)
  const inferred: Record<string, VariantAttributeDefinition> = {};

  // Check for colors
  const colors = new Set(props.variants.map((v) => v.color).filter(Boolean));
  if (colors.size > 0 || (props.colors && props.colors.length > 0)) {
    const colorList =
      props.colors && props.colors.length > 0
        ? props.colors
        : (Array.from(colors) as string[]);
    inferred.color = {
      name: "color",
      label: "Renk",
      type: "color",
      options: colorList.map((c) => ({ value: c, label: c })),
    };
  }

  // Check for sizes
  const sizes = new Set(props.variants.map((v) => v.size).filter(Boolean));
  if (sizes.size > 0 || (props.sizes && props.sizes.length > 0)) {
    const sizeList =
      props.sizes && props.sizes.length > 0
        ? props.sizes
        : (Array.from(sizes) as string[]);
    inferred.size = {
      name: "size",
      label: "Beden",
      type: "size",
      options: sizeList.map((s) => ({ value: s, label: s })),
    };
  }

  // Check for attributes from variants
  props.variants.forEach((v) => {
    if (v.attributes) {
      Object.entries(v.attributes).forEach(([key, value]) => {
        if (value && !inferred[key]) {
          const values = new Set(
            props.variants
              .map((variant) => variant.attributes?.[key])
              .filter(Boolean),
          );
          inferred[key] = {
            name: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            type: "select",
            options: Array.from(values).map((v) => ({
              value: v as string,
              label: v as string,
            })),
          };
        }
      });
    }
  });

  return inferred;
});

// Get attribute names
const attributeNames = computed(() => Object.keys(attributeDefinitions.value));

// Find matching variant based on selected attributes
const selectedVariant = computed(() => {
  return props.variants.find((v) => {
    return attributeNames.value.every((attrName) => {
      const selectedValue = selectedAttributes.value[attrName];
      if (!selectedValue) return true; // No selection, match any

      // Check in flexible attributes first
      if (v.attributes && v.attributes[attrName] === selectedValue) {
        return true;
      }

      // Fallback to legacy fields
      if (attrName === "color" && v.color === selectedValue) return true;
      if (attrName === "size" && v.size === selectedValue) return true;

      return false;
    });
  });
});

// Check if an option is available (has stock with current selections)
function isOptionAvailable(attrName: string, optionValue: string): boolean {
  return props.variants.some((v) => {
    // Check this attribute value
    let matchesAttr = false;
    if (v.attributes && v.attributes[attrName] === optionValue) {
      matchesAttr = true;
    } else if (attrName === "color" && v.color === optionValue) {
      matchesAttr = true;
    } else if (attrName === "size" && v.size === optionValue) {
      matchesAttr = true;
    }

    if (!matchesAttr) return false;

    // Check other selected attributes
    const otherMatch = attributeNames.value
      .filter((name) => name !== attrName)
      .every((name) => {
        const selectedValue = selectedAttributes.value[name];
        if (!selectedValue) return true;

        if (v.attributes && v.attributes[name] === selectedValue) return true;
        if (name === "color" && v.color === selectedValue) return true;
        if (name === "size" && v.size === selectedValue) return true;

        return false;
      });

    return otherMatch && v.stockQuantity > 0;
  });
}

// Get the current value for display
function getSelectedDisplayValue(attrName: string): string {
  const value = selectedAttributes.value[attrName];
  if (!value) return "Seçiniz";

  const attr = attributeDefinitions.value[attrName];
  if (!attr) return value;

  const option = attr.options.find((o) => o.value === value);
  return option?.label || value;
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

    attributeNames.value.forEach((attrName) => {
      // Check flexible attributes first
      if (firstAvailable.attributes && firstAvailable.attributes[attrName]) {
        selectedAttributes.value[attrName] =
          firstAvailable.attributes[attrName];
      }
      // Fallback to legacy fields
      else if (attrName === "color" && firstAvailable.color) {
        selectedAttributes.value[attrName] = firstAvailable.color;
      } else if (attrName === "size" && firstAvailable.size) {
        selectedAttributes.value[attrName] = firstAvailable.size;
      }
    });
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
    <!-- Dynamic Attribute Selection -->
    <div v-for="attrName in attributeNames" :key="attrName">
      <label class="text-sm font-medium mb-2 block">
        {{ attributeDefinitions[attrName].label }}:
        {{ getSelectedDisplayValue(attrName) }}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in attributeDefinitions[attrName].options"
          :key="option.value"
          type="button"
          class="px-3 py-1.5 text-sm border rounded-md transition-colors"
          :class="[
            selectedAttributes[attrName] === option.value
              ? 'border-primary bg-primary text-primary-foreground'
              : isOptionAvailable(attrName, option.value)
                ? 'border-border hover:border-primary'
                : 'border-border opacity-50 cursor-not-allowed line-through',
          ]"
          :disabled="!isOptionAvailable(attrName, option.value)"
          @click="selectedAttributes[attrName] = option.value"
        >
          <span class="flex items-center gap-1.5">
            <!-- Color swatch for color type -->
            <span
              v-if="
                attributeDefinitions[attrName].type === 'color' &&
                option.colorCode
              "
              class="w-4 h-4 rounded-full border border-gray-300"
              :style="{ backgroundColor: option.colorCode }"
            />
            {{ option.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Selected Variant Info -->
    <div v-if="selectedVariant" class="pt-2 border-t">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">
          SKU: {{ selectedVariant.sku || "-" }}
        </span>
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

    <!-- No variants available message -->
    <div
      v-else-if="variants.length === 0"
      class="text-muted-foreground text-sm"
    >
      Bu ürün için varyant bulunmamaktadır.
    </div>
  </div>
</template>
