<script setup lang="ts">
import { Package, ChevronRight, Truck, Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";

definePageMeta({
  layout: "account",
  middleware: "auth",
});

useHead({
  title: "Siparişlerim | Hesabım",
});

const { data: ordersData, pending, refresh } = await useFetch("/api/orders");
const orders = computed(() => ordersData.value?.data || []);

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

const ticketLoadingFor = ref<string | null>(null);

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

async function createOrderTicket(order: OrderSummary, type: "cancel" | "return") {
  ticketLoadingFor.value = order.id;
  const isCancel = type === "cancel";
  const subject = isCancel
    ? `Sipariş iptal talebi - ${order.orderNumber}`
    : `Sipariş iade talebi - ${order.orderNumber}`;
  const message = isCancel
    ? `Merhaba, ${order.orderNumber} numaralı siparişimin iptal edilmesini talep ediyorum.`
    : `Merhaba, ${order.orderNumber} numaralı siparişim için iade talep ediyorum. Lütfen süreç hakkında bilgi verir misiniz?`;

  try {
    await $fetch("/api/tickets", {
      method: "POST",
      body: {
        subject,
        category: "order",
        orderId: order.id,
        message,
      },
    });
    toast.success(
      isCancel ? "İptal talebiniz alındı." : "İade talebiniz alındı."
    );
    await refresh();
  } catch (err: any) {
    const msg =
      err?.data?.statusMessage ||
      err?.data?.message ||
      err?.message ||
      "Talep oluşturulamadı.";
    toast.error(msg);
  } finally {
    ticketLoadingFor.value = null;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Siparişlerim</h1>
      <p class="text-muted-foreground">Geçmiş ve aktif siparişlerinizi takip edin</p>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="text-center py-16 border-2 border-dashed rounded-xl">
      <Package class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">Henüz siparişiniz yok</h2>
      <p class="text-muted-foreground mb-6">Alışverişe başlayarak ilk siparişinizi oluşturun</p>
      <Button asChild>
        <NuxtLink to="/shop">Alışverişe Başla</NuxtLink>
      </Button>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <Card
        v-for="order in orders"
        :key="order.id"
        class="hover:shadow-md transition-shadow overflow-hidden"
      >
        <NuxtLink :to="`/orders/${order.id}`" class="block">
          <CardHeader class="flex flex-row items-center justify-between pb-2 bg-muted/30">
            <div>
              <CardTitle class="text-lg">{{ order.orderNumber }}</CardTitle>
              <CardDescription>{{ formatDate(order.createdAt as any) }}</CardDescription>
            </div>
            <div class="flex items-center gap-2">
              <OrderStatusBadge :status="order.status" />
              <ChevronRight class="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <!-- First 3 product images -->
                <div class="flex -space-x-2">
                  <NuxtImg
                    v-for="(item, index) in order.items.slice(0, 3)"
                    :key="item.id"
                    :src="item.product?.images?.[0]?.url || item.product?.thumbnail || '/placeholder-product.avif'"
                    preset="avatar"
                    :alt="item.productTitle"
                    class="w-10 h-10 rounded-full border-2 border-background object-cover bg-muted"
                    :style="{ zIndex: 3 - index }"
                  />
                  <div
                    v-if="order.items.length > 3"
                    class="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium"
                  >
                    +{{ order.items.length - 3 }}
                  </div>
                </div>
                <span class="text-sm text-muted-foreground">
                  {{ order.items.length }} ürün
                </span>
              </div>
              <div class="text-right space-y-1">
                <p class="font-bold text-lg">{{ formatPrice(order.total) }}</p>
                <div class="flex gap-1 justify-end">
                  <OrderStatusBadge
                    :status="order.paymentStatus"
                    type="payment"
                    size="sm"
                  />
                </div>
                <!-- Kargo bilgisi -->
                <p
                  v-if="order.trackingNumber"
                  class="text-xs text-muted-foreground flex items-center gap-1 justify-end"
                >
                  <Truck class="h-3 w-3" />
                  <span>Takip: {{ order.trackingNumber }}</span>
                </p>
                <a
                  v-if="order.trackingUrl"
                  :href="order.trackingUrl"
                  target="_blank"
                  rel="noopener"
                  class="block text-[11px] text-primary hover:underline"
                  @click.stop
                >
                  Kargoyu takip et
                </a>
                <p
                  v-else-if="!order.trackingNumber && order.fulfillmentStatus !== 'fulfilled'"
                  class="text-[11px] text-muted-foreground"
                >
                  Kargo hazırlık aşamasında
                </p>
              </div>
            </div>
            <!-- İptal / iade talebi butonları -->
            <div class="mt-4 flex flex-wrap gap-2 justify-end text-xs">
              <!-- Ödeme alınmadı veya bekliyor ise iptal talebi -->
              <Button
                v-if="order.status === 'pending' && order.paymentStatus !== 'paid'"
                size="xs"
                variant="outline"
                :disabled="ticketLoadingFor === order.id"
                @click.stop.prevent="createOrderTicket(order as any, 'cancel')"
              >
                {{ ticketLoadingFor === order.id ? "Gönderiliyor..." : "İptal talebi oluştur" }}
              </Button>
              <!-- Teslim edilmiş / kargolanmış sipariş için iade talebi -->
              <Button
                v-else-if="order.paymentStatus === 'paid'"
                size="xs"
                variant="ghost"
                :disabled="ticketLoadingFor === order.id"
                @click.stop.prevent="createOrderTicket(order as any, 'return')"
              >
                {{ ticketLoadingFor === order.id ? "Gönderiliyor..." : "İade talebi oluştur" }}
              </Button>
            </div>
          </CardContent>
        </NuxtLink>
      </Card>
    </div>
  </div>
</template>
