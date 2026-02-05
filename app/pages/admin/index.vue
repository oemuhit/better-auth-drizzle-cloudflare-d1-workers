<script setup lang="ts">
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-vue-next";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useHead({
  title: "Admin Dashboard",
});

// Fetch stats (in a real app, these would come from dedicated API endpoints)
const { data: productsData } = await useFetch("/api/products", {
  query: { includeAll: true, limit: 1 },
});
const { data: ordersData } = await useFetch("/api/admin/orders", {
  query: { limit: 500 },
});
const { data: categoriesData } = await useFetch("/api/categories", {
  query: { includeInactive: true },
});

const totalProducts = computed(
  () => productsData.value?.pagination?.total || 0,
);
const recentOrders = computed(() => ordersData.value?.data || []);
const totalOrders = computed(() => ordersData.value?.pagination?.total || 0);
const totalCategories = computed(() => categoriesData.value?.data?.length || 0);

// Calculate total revenue (simple sum)
const totalRevenue = computed(() => {
  return recentOrders.value.filter(order => order.status === "completed").reduce(
    (sum: number, order: any) => sum + (order.total || 0),
    0,
  );
});

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

function formatDate(date: number | Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
</script>

<template>


  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <p class="text-muted-foreground">
        E-ticaret yönetim paneline hoş geldiniz
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard title="Toplam Ürün" :value="totalProducts" :icon="Package" />
      <StatsCard
        title="Toplam Sipariş"
        :value="totalOrders"
        :icon="ShoppingCart"
      />
      <StatsCard
        title="Toplam Gelir"
        :value="formatPrice(totalRevenue)"
        :icon="TrendingUp"
      />
      <StatsCard title="Kategoriler" :value="totalCategories" :icon="Users" />
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Recent Orders -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Son Siparişler</CardTitle>
          <Button variant="outline" size="sm">
            <NuxtLink to="/admin/orders">Tümünü Gör</NuxtLink>
          </Button>
        </CardHeader>
        <CardContent>
          <div
            v-if="recentOrders.length === 0"
            class="text-center py-8 text-muted-foreground"
          >
            Henüz sipariş yok
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="order in recentOrders.slice(0, 5)"
              :key="order.id"
              class="flex items-center justify-between"
            >
              <div>
                <p class="font-medium">{{ order.orderNumber }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ order.user?.name || order.user?.email }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-medium">{{ formatPrice(order.total) }}</p>
                <OrderStatusBadge :status="order.status" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2">
          <Button variant="outline" class="h-auto py-4 flex-col">
            <NuxtLink to="/admin/products/new" class="text-center">
              <Package class="h-6 w-6 mb-2" />
              <span>Yeni Ürün Ekle</span>
            </NuxtLink>
          </Button>
          <Button variant="outline" class="h-auto py-4 flex-col">
            <NuxtLink to="/admin/categories/new" class="text-center">
              <Users class="h-6 w-6 mb-2" />
              <span>Yeni Kategori</span>
            </NuxtLink>
          </Button>
          <Button variant="outline" class="h-auto py-4 flex-col">
            <NuxtLink to="/admin/orders" class="text-center">
              <ShoppingCart class="h-6 w-6 mb-2" />
              <span>Siparişleri Yönet</span>
            </NuxtLink>
          </Button>
          <Button variant="outline" class="h-auto py-4 flex-col">
            <NuxtLink to="/shop" class="text-center">
              <TrendingUp class="h-6 w-6 mb-2" />
              <span>Mağazayı Görüntüle</span>
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
