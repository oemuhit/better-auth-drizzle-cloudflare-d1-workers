<script setup lang="ts">
import { ChevronLeft, MapPin, CreditCard, Package } from "lucide-vue-next";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const route = useRoute();
const id = computed(() => route.params.id as string);

const { data: orderData, error } = await useFetch(`/api/orders/${id.value}`);

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Sipariş bulunamadı",
  });
}

const order = computed(() => orderData.value?.data);

useHead({
  title: computed(() =>
    order.value ? `Sipariş ${order.value.orderNumber}` : "Sipariş",
  ),
});

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

function formatDate(date: number | Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getAddressDisplay(address: any) {
  if (!address) return "-";
  const parts = [
    address.firstName,
    address.lastName,
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
  ].filter(Boolean);
  return parts.join(", ");
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <Button variant="ghost" class="mb-4" @click="navigateTo('/orders')">
      <ChevronLeft class="h-4 w-4 mr-2" />
      Siparişlerime Dön
    </Button>

    <div v-if="order" class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 class="text-3xl font-bold">{{ order.orderNumber }}</h1>
          <p class="text-muted-foreground">{{ formatDate(order.createdAt) }}</p>
        </div>
        <div class="flex gap-2">
          <OrderStatusBadge :status="order.status" />
          <OrderStatusBadge :status="order.paymentStatus" type="payment" />
          <OrderStatusBadge
            :status="order.fulfillmentStatus"
            type="fulfillment"
          />
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Order Items -->
        <div class="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Package class="h-5 w-5" />
                Sipariş Kalemleri
              </CardTitle>
            </CardHeader>
            <CardContent class="divide-y">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex gap-4 py-4 first:pt-0 last:pb-0"
              >
                <img
                  :src="item.product?.thumbnail || '/placeholder-product.jpg'"
                  :alt="item.productTitle"
                  class="w-20 h-20 rounded-md object-cover"
                />
                <div class="flex-1">
                  <NuxtLink
                    v-if="item.product"
                    :to="`/shop/${item.product.slug}`"
                    class="font-medium hover:text-primary"
                  >
                    {{ item.productTitle }}
                  </NuxtLink>
                  <p v-else class="font-medium">{{ item.productTitle }}</p>
                  <p
                    v-if="item.variantInfo"
                    class="text-sm text-muted-foreground"
                  >
                    {{ item.variantInfo }}
                  </p>
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-sm text-muted-foreground">
                      {{ formatPrice(item.price) }} x {{ item.quantity }}
                    </span>
                    <span class="font-semibold">{{
                      formatPrice(item.total)
                    }}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Order Summary & Addresses -->
        <div class="space-y-6">
          <!-- Summary -->
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Ara Toplam</span>
                <span>{{ formatPrice(order.subtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Kargo</span>
                <span>{{
                  order.shippingTotal > 0
                    ? formatPrice(order.shippingTotal)
                    : "Ücretsiz"
                }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">KDV</span>
                <span>{{ formatPrice(order.taxTotal) }}</span>
              </div>
              <div
                v-if="order.discountTotal > 0"
                class="flex justify-between text-sm text-green-600"
              >
                <span>İndirim</span>
                <span>-{{ formatPrice(order.discountTotal) }}</span>
              </div>
              <Separator />
              <div class="flex justify-between font-semibold text-lg">
                <span>Toplam</span>
                <span>{{ formatPrice(order.total) }}</span>
              </div>
            </CardContent>
          </Card>

          <!-- Shipping Address -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-base">
                <MapPin class="h-4 w-4" />
                Teslimat Adresi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                {{ getAddressDisplay(order.shippingAddress) }}
              </p>
            </CardContent>
          </Card>

          <!-- Billing Address -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-base">
                <CreditCard class="h-4 w-4" />
                Fatura Adresi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                {{ getAddressDisplay(order.billingAddress) }}
              </p>
            </CardContent>
          </Card>

          <!-- Notes -->
          <Card v-if="order.notes">
            <CardHeader>
              <CardTitle class="text-base">Sipariş Notu</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">{{ order.notes }}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
