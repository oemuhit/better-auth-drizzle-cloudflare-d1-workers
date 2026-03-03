<script setup lang="ts">
import { ChevronLeft, MapPin, User, Loader2, Truck, ExternalLink, Package2, XCircle, RotateCcw } from "lucide-vue-next";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

const route = useRoute();
const id = route.params.id as string;

// Fetch order (using new direct admin endpoint)
const {
  data: orderData,
  error: fetchError,
  refresh,
  status,
} = await useFetch(`/api/admin/orders/${id}`, {
  key: `admin-order-${id}`,
  headers: useRequestHeaders(['cookie']),
});

const order = computed(() => orderData.value?.data);

// Handle errors after hydration
onMounted(() => {
  if (fetchError.value && !order.value) {
    throw createError({
      statusCode: fetchError.value.statusCode || 404,
      statusMessage: fetchError.value.statusMessage || "Sipariş bulunamadı",
    });
  }
});

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
    await $fetch(`/api/admin/orders/${id}/status`, {
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

// Geliver shipment
const isCreatingShipment = ref(false);
const shipmentError = ref<string | null>(null);
const shipmentSuccess = ref(false);

// Offer selection flow
const isFetchingOffers = ref(false);
const isAcceptingOffer = ref(false);
const offersData = ref<{ shipmentId: string; offers: any[]; cheapestOfferId?: string } | null>(null);
const offerError = ref<string | null>(null);
const selectedOfferId = ref<string | null>(null);

async function fetchOffers() {
  isFetchingOffers.value = true;
  offerError.value = null;
  offersData.value = null;
  selectedOfferId.value = null;
  try {
    const res: any = await $fetch(`/api/admin/orders/${id}/shipment-offers`);
    offersData.value = res.data;
    // Pre-select cheapest
    selectedOfferId.value = res.data?.cheapestOfferId ?? res.data?.offers?.[0]?.id ?? null;
  } catch (err: any) {
    offerError.value = err.data?.message || err.message || "Teklifler alınamadı";
  } finally {
    isFetchingOffers.value = false;
  }
}

async function acceptSelectedOffer() {
  if (!selectedOfferId.value || !offersData.value) return;
  isAcceptingOffer.value = true;
  offerError.value = null;
  shipmentSuccess.value = false;
  try {
   const res = await $fetch(`/api/admin/orders/${id}/accept-offer`, {
      method: "POST",
      body: { offerId: selectedOfferId.value, shipmentId: offersData.value.shipmentId },
    });
    console.log(res);
    shipmentSuccess.value = true;
    offersData.value = null;
    await refresh();
  } catch (err: any) {
    offerError.value = err.data?.message || err.message || "Teklif kabul edilemedi";
  } finally {
    isAcceptingOffer.value = false;
  }
}

async function createShipment() {
  isCreatingShipment.value = true;
  shipmentError.value = null;
  shipmentSuccess.value = false;
  try {
    await $fetch(`/api/admin/orders/${id}/create-shipment`, { method: "POST" });
    shipmentSuccess.value = true;
    await refresh();
  } catch (err: any) {
    shipmentError.value = err.data?.statusMessage || "Kargo oluşturulamadı";
  } finally {
    isCreatingShipment.value = false;
  }
}

// Cancel shipment
const isCancellingShipment = ref(false);
const cancelShipmentError = ref<string | null>(null);
const showCancelConfirm = ref(false);

async function cancelShipment() {
  isCancellingShipment.value = true;
  cancelShipmentError.value = null;
  showCancelConfirm.value = false;
  try {
    await $fetch(`/api/admin/orders/${id}/cancel-shipment`, { method: "POST" });
    await refresh();
  } catch (err: any) {
    cancelShipmentError.value = err.data?.message || err.message || "Kargo iptal edilemedi";
  } finally {
    isCancellingShipment.value = false;
  }
}

// Create return shipment
const isCreatingReturn = ref(false);
const returnError = ref<string | null>(null);
const returnSuccess = ref<{ barcode?: string; labelUrl?: string } | null>(null);

async function createReturn() {
  isCreatingReturn.value = true;
  returnError.value = null;
  returnSuccess.value = null;
  try {
    const res: any = await $fetch(`/api/admin/orders/${id}/create-return`, { method: "POST" });
    returnSuccess.value = res.data;
    await refresh();
  } catch (err: any) {
    returnError.value = err.data?.message || err.message || "İade kargosu oluşturulamadı";
  } finally {
    isCreatingReturn.value = false;
  }
}

// Refresh shipment info from Geliver (tracking number, barcode, label URL)
const isRefreshingShipment = ref(false);
const refreshShipmentError = ref<string | null>(null);

async function refreshShipmentInfo() {
  isRefreshingShipment.value = true;
  refreshShipmentError.value = null;
  try {
    await $fetch(`/api/admin/orders/${id}/refresh-shipment`, { method: "POST" });
    await refresh();
  } catch (err: any) {
    refreshShipmentError.value = err.data?.message || err.message || "Kargo bilgisi güncellenemedi";
  } finally {
    isRefreshingShipment.value = false;
  }
}


function formatOfferPrice(offer: any) {
  const price = offer.totalAmount ?? offer.totalPrice ?? offer.amount ?? 0;
  return `${Number(price).toFixed(2)} ₺`;
}
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
                  @update:model-value="(val) => updateStatus('status', val as string)"
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
                    (val) => updateStatus('paymentStatus', val as string)
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
                    (val) => updateStatus('fulfillmentStatus', val as string)
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
              {{ getAddressDisplay(order.shippingAddressSnapshot) }}
            </p>
          </CardContent>
        </Card>

        <!-- Billing Address -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <MapPin class="h-4 w-4" />
              Fatura Adresi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              {{ getAddressDisplay(order.billingAddressSnapshot) }}
            </p>
          </CardContent>
        </Card>

        <!-- Geliver Kargo -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <Truck class="h-4 w-4" />
              Geliver Kargo
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">

            <!-- Active shipment info -->
            <template v-if="order.trackingNumber || order.geliverShipmentId">
              <div v-if="order.trackingNumber" class="space-y-1">
                <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">Takip Numarası</p>
                <p class="font-mono font-semibold text-sm">{{ order.trackingNumber }}</p>
              </div>

              <div v-if="order.barcode" class="space-y-1">
                <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">Barkod (Barcode)</p>
                <p class="font-mono font-semibold text-sm">{{ order.barcode }}</p>
              </div>

              <div class="flex flex-wrap gap-4 pt-1">
                <div v-if="order.trackingUrl">
                  <a :href="order.trackingUrl" target="_blank" rel="noopener"
                    class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Package2 class="h-3.5 w-3.5" /> Kargoya Git <ExternalLink class="h-3 w-3" />
                  </a>
                </div>
                <div v-if="order.labelUrl">
                  <a :href="order.labelUrl" target="_blank" rel="noopener"
                    class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    Etiket İndir (PDF) <ExternalLink class="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div v-if="order.transactionId" class="pt-2 border-t border-dashed mt-2">
                <p class="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
                  <span>ID: {{ order.transactionId }}</span>
                  <span v-if="order.amountCharged">Ücret: {{ order.amountCharged }} {{ order.currency }}</span>
                </p>
              </div>
              <!-- Return shipment info -->
              <div v-if="order.returnBarcode || order.returnLabelUrl" class="mt-2 space-y-1">
                <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  İade Barkodu
                </p>
                <p v-if="order.returnBarcode" class="font-mono text-xs">
                  {{ order.returnBarcode }}
                </p>
                <a
                  v-if="order.returnLabelUrl"
                  :href="order.returnLabelUrl"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  İade Etiketini İndir <ExternalLink class="h-3 w-3" />
                </a>
              </div>
              <Separator />
            </template>

            <p v-if="!order.geliverShipmentId && !offersData" class="text-sm text-muted-foreground">
              Henüz kargo oluşturulmadı.
            </p>

            <!-- Error messages -->
            <p v-if="shipmentError" class="text-xs text-destructive">{{ shipmentError }}</p>
            <p v-if="offerError" class="text-xs text-destructive">{{ offerError }}</p>
            <p v-if="shipmentSuccess" class="text-xs text-green-600">Kargo başarıyla oluşturuldu!</p>

            <!-- Offer list (shown after fetchOffers) -->
            <div v-if="offersData" class="space-y-2">
              <p class="text-xs text-muted-foreground font-medium">
                {{ offersData.offers.length }} teklif bulundu — birini seçin:
              </p>
              <div
                v-for="offer in offersData.offers"
                :key="offer.id"
                class="flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-all"
                :class="selectedOfferId === offer.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'"
                @click="selectedOfferId = offer.id"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold truncate">
                    {{ offer.providerName || offer.providerCode || offer.providerServiceCode || 'Kargo' }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ offer.providerServiceCode }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-bold text-primary">{{ formatOfferPrice(offer) }}</p>
                  <p v-if="offersData.cheapestOfferId === offer.id" class="text-xs text-green-600">En ucuz</p>
                </div>
              </div>
              <Button
                size="sm"
                class="w-full mt-1"
                :disabled="!selectedOfferId || isAcceptingOffer"
                @click="acceptSelectedOffer"
              >
                <Loader2 v-if="isAcceptingOffer" class="h-3.5 w-3.5 mr-2 animate-spin" />
                <Truck v-else class="h-3.5 w-3.5 mr-2" />
                Seçilen Teklifi Satın Al
              </Button>
              <Button size="sm" variant="ghost" class="w-full" @click="offersData = null">
                İptal
              </Button>
            </div>

            <!-- Action buttons: fetch offers — only when no tracking number yet -->
            <template v-if="order.paymentStatus === 'paid' && !offersData && !order.trackingNumber">
              <Button
                size="sm"
                variant="outline"
                class="w-full"
                :disabled="isFetchingOffers"
                @click="fetchOffers"
              >
                <Loader2 v-if="isFetchingOffers" class="h-3.5 w-3.5 mr-2 animate-spin" />
                <Truck v-else class="h-3.5 w-3.5 mr-2" />
                {{ order.geliverShipmentId ? 'Yeni Kargo Teklifi Al' : 'Kargo Tekliflerini Getir' }}
              </Button>
            </template>

            <!-- Cancel & Return — only shown when a shipment exists -->
            <template v-if="order.geliverShipmentId && !offersData">
              <Separator />

              <!-- Refresh shipment info button — always available when shipment exists -->
              <Button
                size="sm"
                variant="ghost"
                class="w-full text-muted-foreground"
                :disabled="isRefreshingShipment"
                @click="refreshShipmentInfo"
              >
                <Loader2 v-if="isRefreshingShipment" class="h-3.5 w-3.5 mr-2 animate-spin" />
                <RotateCcw v-else class="h-3.5 w-3.5 mr-2" />
                Kargo Bilgisini Yenile
              </Button>
              <p v-if="refreshShipmentError" class="text-xs text-destructive">{{ refreshShipmentError }}</p>

              <!-- Cancel: only if no return has been created yet -->
              <template v-if="!order.returnShipmentId">
                <div v-if="showCancelConfirm" class="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                  <p class="text-sm font-medium text-destructive">Kargoyu iptal etmek istediğinize emin misiniz?</p>
                  <p class="text-xs text-muted-foreground">Bu işlem Geliver'daki kargoyu ve bakiye iadesini başlatır.</p>
                  <div class="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      class="flex-1"
                      :disabled="isCancellingShipment"
                      @click="cancelShipment"
                    >
                      <Loader2 v-if="isCancellingShipment" class="h-3.5 w-3.5 mr-2 animate-spin" />
                      Evet, İptal Et
                    </Button>
                    <Button size="sm" variant="outline" class="flex-1" @click="showCancelConfirm = false">
                      Vazgeç
                    </Button>
                  </div>
                </div>
                <Button
                  v-else
                  size="sm"
                  variant="outline"
                  class="w-full text-destructive border-destructive/40 hover:bg-destructive/5"
                  :disabled="isCancellingShipment"
                  @click="showCancelConfirm = true"
                >
                  <XCircle class="h-3.5 w-3.5 mr-2" />
                  Kargoyu İptal Et
                </Button>
                <p v-if="cancelShipmentError" class="text-xs text-destructive">{{ cancelShipmentError }}</p>
              </template>

              <!-- Return: only if order is NOT cancelled and no return exists yet -->
              <template v-if="order.status !== 'cancelled' && !order.returnShipmentId">
                <Button
                  size="sm"
                  variant="outline"
                  class="w-full"
                  :disabled="isCreatingReturn"
                  @click="createReturn"
                >
                  <Loader2 v-if="isCreatingReturn" class="h-3.5 w-3.5 mr-2 animate-spin" />
                  <RotateCcw v-else class="h-3.5 w-3.5 mr-2" />
                  İade Kargosu Oluştur
                </Button>
                <p v-if="returnError" class="text-xs text-destructive">{{ returnError }}</p>
              </template>

              <!-- Persistent return info from DB -->
              <div v-if="order.returnShipmentId" class="rounded-md bg-green-50 border border-green-200 p-3 text-sm space-y-1">
                <p class="font-semibold text-green-800">İade kargosu oluşturuldu ✓</p>
                <p class="text-xs text-muted-foreground font-mono">{{ order.returnShipmentId }}</p>
                <p v-if="order.returnBarcode" class="font-mono text-xs text-green-700">{{ order.returnBarcode }}</p>
                <a v-if="order.returnLabelUrl" :href="order.returnLabelUrl" target="_blank"
                  class="text-xs text-primary underline">İade Etiketini İndir</a>
              </div>

            </template>


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
