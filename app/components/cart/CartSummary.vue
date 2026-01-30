<script setup lang="ts">
const props = defineProps<{
  subtotal: number;
  taxTotal?: number;
  shippingTotal?: number;
  discountTotal?: number;
  total?: number;
  showDetails?: boolean;
  taxInclusive?: boolean; // If true, tax is already included in prices
}>();

const { formatPrice } = useCart();

const calculatedTotal = computed(() => {
  // If total is provided, use it
  if (props.total !== undefined) {
    return props.total;
  }
  // If tax is inclusive, don't add it to total (it's already in subtotal)
  if (props.taxInclusive) {
    return (
      props.subtotal + (props.shippingTotal || 0) - (props.discountTotal || 0)
    );
  }
  // Otherwise add tax to total
  return (
    props.subtotal +
    (props.taxTotal || 0) +
    (props.shippingTotal || 0) -
    (props.discountTotal || 0)
  );
});
</script>

<template>
  <div class="space-y-2">
    <!-- Subtotal -->
    <div class="flex justify-between text-sm">
      <span class="text-muted-foreground">Ara Toplam</span>
      <span>{{ formatPrice(subtotal) }}</span>
    </div>

    <!-- Shipping -->
    <div v-if="showDetails" class="flex justify-between text-sm">
      <span class="text-muted-foreground">Kargo</span>
      <span v-if="shippingTotal !== undefined">
        {{ shippingTotal > 0 ? formatPrice(shippingTotal) : "Ücretsiz" }}
      </span>
      <span v-else class="text-muted-foreground">Hesaplanacak</span>
    </div>

    <!-- Tax -->
    <div
      v-if="showDetails && taxTotal !== undefined"
      class="flex justify-between text-sm"
    >
      <span class="text-muted-foreground">
        KDV <span v-if="taxInclusive" class="text-xs">(dahil)</span>
      </span>
      <span>{{ formatPrice(taxTotal) }}</span>
    </div>

    <!-- Discount -->
    <div
      v-if="discountTotal && discountTotal > 0"
      class="flex justify-between text-sm text-green-600"
    >
      <span>İndirim</span>
      <span>-{{ formatPrice(discountTotal) }}</span>
    </div>

    <Separator />

    <!-- Total -->
    <div class="flex justify-between font-semibold text-lg">
      <span>Toplam</span>
      <span>{{ formatPrice(showDetails ? calculatedTotal : subtotal) }}</span>
    </div>

    <!-- Info Text -->
    <p v-if="!showDetails" class="text-xs text-muted-foreground">
      Kargo ve vergiler ödeme sırasında hesaplanacaktır.
    </p>
  </div>
</template>
