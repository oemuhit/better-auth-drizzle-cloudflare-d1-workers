<script setup lang="ts">
import { ChevronLeft, MapPin, User, Loader2 } from "lucide-vue-next";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const id = computed(() => route.params.id as string);

// Fetch order (using admin endpoint to get user info)
const {
  data: orderData,
  error,
  refresh,
} = await useFetch(`/api/admin/orders`, {
  query: { limit: 1 },
  transform: (data: any) => {
    const order = data.data?.find((o: any) => o.id === id.value);
    return order ? { data: order } : null;
  },
});

// If not found in list, try direct fetch with user's order endpoint
const order = computed(() => orderData.value?.data);

if (!order.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Sipariş bulunamadı",
  });
}

useHead({
  title: computed(() =>
    order.value ? `Sipariş ${order.value.orderNumber} | Admin` : "Sipariş",
  ),
});

// Status update
const isUpdating = ref(false);
const updateError = ref<string | null>(null);

async function updateStatus(field: string, value: string) {
  isUpdating.value = true;
  updateError.value = null;

  try {
    await $fetch(`/api/admin/orders/${id.value}/status`, {
      method: "PATCH",
      body: { [field]: value },
    });
    await refresh();
  } catch (err: any) {
    updateError.value = err.data?.statusMessage || "Durum güncellenemedi";
  } finally {
    isUpdating.value = false;
  }
}

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
    address.city,
    address.postalCode,
  ].filter(Boolean);
  return parts.join(", ");
}

const statusOptions = [
  { label: "Bekliyor", value: "pending" },
  { label: "İşleniyor", value: "processing" },
  { label: "Tamamlandı", value: "completed" },
  { label: "İptal Edildi", value: "cancelled" },
];

const paymentOptions = [
  { label: "Ödenmedi", value: "not_paid" },
  { label: "Bekliyor", value: "awaiting" },
  { label: "Ödendi", value: "paid" },
  { label: "İade Edildi", value: "refunded" },
];

const fulfillmentOptions = [
  { label: "Açık", value: "open" },
  { label: "Hazırlanıyor", value: "in_progress" },
  { label: "Tamamlandı", value: "fulfilled" },
  { label: "Beklemede", value: "on_hold" },
];
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="navigateTo('/admin/orders')">
        <ChevronLeft class="h-5 w-5" />
      </Button>
      <div class="flex-1">
        <h1 class="text-3xl font-bold">{{ order?.orderNumber }}</h1>
        <p class="text-muted-foreground">
          {{ order ? formatDate(order.createdAt) : "" }}
        </p>
      </div>
      <div class="flex gap-2">
        <OrderStatusBadge v-if="order" :status="order.status" />
        <OrderStatusBadge
          v-if="order"
          :status="order.paymentStatus"
          type="payment"
        />
        <OrderStatusBadge
          v-if="order"
          :status="order.fulfillmentStatus"
          type="fulfillment"
        />
      </div>
    </div>

    <div v-if="order" class="grid lg:grid-cols-3 gap-6">
      <!-- Left Column -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Order Items -->
        <Card>
          <CardHeader>
            <CardTitle>Sipariş Kalemleri</CardTitle>
          </CardHeader>
          <CardContent class="divide-y">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div
                class="w-16 h-16 bg-muted rounded flex items-center justify-center text-2xl"
              >
                📦
              </div>
              <div class="flex-1">
                <p class="font-medium">{{ item.productTitle }}</p>
                <p
                  v-if="item.variantInfo"
                  class="text-sm text-muted-foreground"
                >
                  {{ item.variantInfo }}
                </p>
                <div class="flex items-center justify-between mt-1">
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

        <!-- Status Management -->
        <Card>
          <CardHeader>
            <CardTitle>Durum Yönetimi</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <p v-if="updateError" class="text-sm text-destructive">
              {{ updateError }}
            </p>

            <div class="grid gap-4 sm:grid-cols-3">
              <div class="space-y-2">
                <Label>Sipariş Durumu</Label>
                <Select
                  :model-value="order.status"
                  :disabled="isUpdating"
                  @update:model-value="(val) => updateStatus('status', val)"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>Ödeme Durumu</Label>
                <Select
                  :model-value="order.paymentStatus"
                  :disabled="isUpdating"
                  @update:model-value="
                    (val) => updateStatus('paymentStatus', val)
                  "
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opt in paymentOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>Teslimat Durumu</Label>
                <Select
                  :model-value="order.fulfillmentStatus"
                  :disabled="isUpdating"
                  @update:model-value="
                    (val) => updateStatus('fulfillmentStatus', val)
                  "
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opt in fulfillmentOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Column -->
      <div class="space-y-6">
        <!-- Order Summary -->
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
              <span>{{ formatPrice(order.shippingTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">KDV</span>
              <span>{{ formatPrice(order.taxTotal) }}</span>
            </div>
            <Separator />
            <div class="flex justify-between font-semibold text-lg">
              <span>Toplam</span>
              <span>{{ formatPrice(order.total) }}</span>
            </div>
          </CardContent>
        </Card>

        <!-- Customer -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <User class="h-4 w-4" />
              Müşteri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="font-medium">{{ order.user?.name || "-" }}</p>
            <p class="text-sm text-muted-foreground">{{ order.user?.email }}</p>
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
</template>
