<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Package,
  CreditCard,
  LifeBuoy,
} from "lucide-vue-next";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

const route = useRoute();
const id = route.params.id as string;

// Fetch customer details
const { data: customerData, error } = await useFetch(
  `/api/admin/customers/${id}`,
  {
    headers: useRequestHeaders(['cookie']),
  }
);

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Müşteri bulunamadı",
  });
}

const customer = computed(() => customerData.value?.data);
const orders = computed(() => customerData.value?.orders || []);
const tickets = computed(() => customerData.value?.tickets || []);

// Orders pagination
const ordersPage = ref(1);
const ordersPerPage = 5;
const totalOrderPages = computed(() => Math.ceil(orders.value.length / ordersPerPage));
const paginatedOrders = computed(() => {
  const start = (ordersPage.value - 1) * ordersPerPage;
  return orders.value.slice(start, start + ordersPerPage);
});

useHead({
  title: computed(() =>
    customer.value
      ? `${customer.value.name || customer.value.email} | Admin`
      : "Müşteri Detay",
  ),
});

function formatDate(date: string | number | Date | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "open": return "default";
    case "closed": return "secondary";
    case "pending": return "outline";
    case "in_progress": return "destructive";
    default: return "secondary";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "open": return "Açık";
    case "closed": return "Kapalı";
    case "pending": return "Yanıt Bekliyor";
    case "in_progress": return "İşlemde";
    default: return status;
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        @click="navigateTo('/admin/customers')"
      >
        <ChevronLeft class="h-5 w-5" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold">
          {{ customer?.name || customer?.email }}
        </h1>
        <p class="text-muted-foreground">Müşteri Detayları</p>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-3">
      <!-- Customer Info -->
      <Card class="md:col-span-1">
        <CardHeader>
          <CardTitle>Müşteri Bilgileri</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
            >
              <span class="text-lg font-semibold text-primary">
                {{
                  (customer?.name || customer?.email || "?")[0].toUpperCase()
                }}
              </span>
            </div>
            <div>
              <p class="font-medium">{{ customer?.name || "-" }}</p>
              <p class="text-sm text-muted-foreground">{{ customer?.email }}</p>
            </div>
          </div>

          <Separator />

          <div class="space-y-3">
            <div class="flex items-center gap-2 text-sm">
              <Mail class="h-4 w-4 text-muted-foreground" />
              <span>{{ customer?.email }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <Calendar class="h-4 w-4 text-muted-foreground" />
              <span>Kayıt: {{ formatDate(customer?.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <Package class="h-4 w-4 text-muted-foreground" />
              <span>{{ orders.length }} sipariş</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <LifeBuoy class="h-4 w-4 text-muted-foreground" />
              <span>{{ tickets.length }} destek talebi</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <CreditCard class="h-4 w-4 text-muted-foreground" />
              <span>Toplam: {{ formatPrice(customer?.totalSpent || 0) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Orders & Tickets Column -->
      <div class="md:col-span-2 space-y-6">
        <!-- Orders -->
        <Card>
          <CardHeader>
            <CardTitle>Siparişler ({{ orders.length }})</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              v-if="orders.length === 0"
              class="text-center py-8 text-muted-foreground"
            >
              Henüz sipariş yok
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="order in paginatedOrders"
                :key="order.id"
                class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                @click="navigateTo(`/admin/orders/${order.id}`)"
              >
                <div>
                  <p class="font-medium">{{ order.orderNumber }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ formatDate(order.createdAt) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-medium">{{ formatPrice(order.total) }}</p>
                  <OrderStatusBadge :status="order.status" />
                </div>
              </div>
              
              <!-- Pagination -->
              <div v-if="totalOrderPages > 1" class="flex items-center justify-between pt-4 border-t">
                <p class="text-sm text-muted-foreground">
                  Sayfa {{ ordersPage }} / {{ totalOrderPages }}
                </p>
                <div class="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    :disabled="ordersPage <= 1"
                    @click="ordersPage--"
                  >
                    <ChevronLeft class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    :disabled="ordersPage >= totalOrderPages"
                    @click="ordersPage++"
                  >
                    <ChevronRight class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Support Tickets -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <LifeBuoy class="h-5 w-5" />
              Destek Talepleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              v-if="tickets.length === 0"
              class="text-center py-8 text-muted-foreground"
            >
              Henüz destek talebi yok
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="ticket in tickets"
                :key="ticket.id"
                class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                @click="navigateTo(`/admin/tickets/${ticket.id}`)"
              >
                <div>
                  <p class="font-medium">{{ ticket.subject }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ formatDate(ticket.createdAt) }}
                  </p>
                </div>
                <div class="text-right">
                  <Badge :variant="getStatusColor(ticket.status)">
                    {{ getStatusLabel(ticket.status) }}
                  </Badge>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ ticket.messages?.length || 0 }} mesaj
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
