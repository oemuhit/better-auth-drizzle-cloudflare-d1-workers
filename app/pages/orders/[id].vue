<script setup lang="ts">
import { ChevronLeft, MapPin, CreditCard, Package, LifeBuoy, Truck, ExternalLink } from "lucide-vue-next";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const route = useRoute();
const id = computed(() => route.params.id as string);

const { data: orderData, error: fetchError } = await useFetch(`/api/orders/${id.value}`);

if (fetchError.value) {
  throw createError({
    statusCode: fetchError.value.statusCode || 404,
    statusMessage: fetchError.value.statusMessage || "Sipariş bulunamadı",
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

function formatDate(date: string | number | Date) {
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
    <Button variant="ghost" class="mb-4" @click="navigateTo('/account/orders')">
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
        <div class="flex gap-2 items-center">
          <Button variant="outline" size="sm" asChild>
            <NuxtLink :to="`/account/tickets/create?orderId=${order.id}`">
                <LifeBuoy class="w-4 h-4 mr-2" /> Destek Al
            </NuxtLink>
          </Button>
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
                <NuxtImg
                  :src="item.productVariant?.image || item.product?.images?.[0]?.url || item.product?.thumbnail || '/placeholder-product.avif'"
                  preset="thumbnail"
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


          <!-- İptal durumu banner -->
          <div
            v-if="order.status === 'cancelled'"
            class="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <p class="text-sm font-semibold text-destructive">Bu sipariş iptal edilmiştir.</p>
            <p v-if="order.cancelledAt" class="text-xs text-muted-foreground mt-1">
              {{ formatDate(order.cancelledAt) }}
            </p>
          </div>


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
                {{ getAddressDisplay(order.shippingAddressSnapshot) }}
              </p>
            </CardContent>
          </Card>

          <!-- Geliver Kargo Takip -->
          <Card v-if="order.trackingNumber || order.trackingUrl">
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-base">
                <Truck class="h-4 w-4" />
                Kargo Takip
              </CardTitle>
            </CardHeader>
            <CardContent class="grid gap-4">
              <div v-if="order.trackingNumber" class="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p class="text-xs text-muted-foreground mb-0.5">Takip Numarası</p>
                  <p class="font-mono font-bold tracking-widest text-sm">{{ order.trackingNumber }}</p>
                </div>
              </div>
              <a
                v-if="order.trackingUrl"
                :href="order.trackingUrl"
                target="_blank"
                rel="noopener"
                class="flex items-center justify-center gap-2 w-full rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-primary text-sm font-medium py-2 pb-2.5 px-4"
              >
                <Truck class="h-3.5 w-3.5" />
                Kargo Durumunu Gör
                <ExternalLink class="h-3 w-3 ml-auto" />
              </a>
            </CardContent>
          </Card>

          <!-- İade kargosu bilgisi -->
          <Card v-if="order.returnShipmentId">
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-base">
                <Truck class="h-4 w-4" />
                İade Kargosu
              </CardTitle>
            </CardHeader>
            <CardContent class="grid gap-3">
              <div class="rounded-md bg-amber-50 border border-amber-200 p-3">
                <p class="text-sm font-medium text-amber-800">İade süreciniz başlatıldı</p>
                <p class="text-xs text-amber-700 mt-0.5">Kargo firması tarafından ürünleriniz toplanacaktır.</p>
              </div>
              <div v-if="order.returnBarcode" class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-0.5">İade Takip Numarası</p>
                <p class="font-mono font-bold tracking-widest text-sm">{{ order.returnBarcode }}</p>
              </div>
              <a
                v-if="order.returnLabelUrl"
                :href="order.returnLabelUrl"
                target="_blank"
                rel="noopener"
                class="flex items-center justify-center gap-2 w-full rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-primary text-sm font-medium py-2.5 px-4"
              >
                İade Etiketini İndir
                <ExternalLink class="h-3.5 w-3.5 ml-auto" />
              </a>
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
                {{ getAddressDisplay(order.billingAddressSnapshot) }}
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
