<script setup lang="ts">
import { Eye, ChevronRight } from "lucide-vue-next";
import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useHead({
  title: "Siparişler | Admin",
});

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(20);

// Filters
const statusFilter = ref("all");
const paymentFilter = ref("all");

// Reset to page 1 when filters change
watch([statusFilter, paymentFilter], () => {
  currentPage.value = 1;
});

// Fetch orders
const { data: ordersData, refresh, pending } = await useFetch("/api/admin/orders", {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage.value,
    status: statusFilter.value === "all" ? undefined : statusFilter.value,
    paymentStatus:
      paymentFilter.value === "all" ? undefined : paymentFilter.value,
  })),
  watch: [statusFilter, paymentFilter, currentPage],
  headers: useRequestHeaders(['cookie']),
});

const orders = computed(() => ordersData.value?.data || []);
const pagination = computed(() => ordersData.value?.pagination);

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

function formatDate(date: number | Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Table columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
    cell: ({ row }) =>
      h("span", { class: "font-medium" }, row.original.orderNumber),
  },
  {
    accessorKey: "user",
    header: "Müşteri",
    cell: ({ row }) => {
      const user = row.original.user;
      return h("div", {}, [
        h("p", { class: "font-medium" }, user?.name || "-"),
        h("p", { class: "text-sm text-muted-foreground" }, user?.email || "-"),
      ]);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tarih",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "total",
    header: "Tutar",
    cell: ({ row }) =>
      h("span", { class: "font-medium" }, formatPrice(row.original.total)),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) =>
      h(resolveComponent("OrderStatusBadge"), { status: row.original.status }),
  },
  {
    accessorKey: "paymentStatus",
    header: "Ödeme",
    cell: ({ row }) =>
      h(resolveComponent("OrderStatusBadge"), {
        status: row.original.paymentStatus,
        type: "payment",
      }),
  },
  {
    accessorKey: "fulfillmentStatus",
    header: "Teslimat",
    cell: ({ row }) =>
      h(resolveComponent("OrderStatusBadge"), {
        status: row.original.fulfillmentStatus,
        type: "fulfillment",
      }),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return h(
        resolveComponent("Button"),
        {
          variant: "ghost",
          size: "icon",
          class: "h-8 w-8",
          onClick: () => navigateTo(`/admin/orders/${row.original.id}`),
        },
        () => h(Eye, { class: "h-4 w-4" }),
      );
    },
    enableSorting: false,
  },
];

const statusOptions = [
  { label: "Tümü", value: "all" },
  { label: "Bekliyor", value: "pending" },
  { label: "İşleniyor", value: "processing" },
  { label: "Tamamlandı", value: "completed" },
  { label: "İptal", value: "cancelled" },
];

const paymentOptions = [
  { label: "Tümü", value: "all" },
  { label: "Ödenmedi", value: "not_paid" },
  { label: "Bekliyor", value: "awaiting" },
  { label: "Ödendi", value: "paid" },
  { label: "İade", value: "refunded" },
];
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Siparişler</h1>
      <p class="text-muted-foreground">
        {{ pagination?.total || 0 }} sipariş bulundu
      </p>
    </div>

    <!-- Filters -->
    <div class="flex gap-4">
      <Select v-model="statusFilter">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Sipariş Durumu" />
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

      <Select v-model="paymentFilter">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Ödeme Durumu" />
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

    <Card>
      <CardContent class="pt-6">
        <DataTable
          :columns="columns"
          :data="orders"
          search-placeholder="Sipariş ara..."
        />
        
        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between mt-6 pt-4 border-t">
          <p class="text-sm text-muted-foreground">
            Sayfa {{ pagination.page }} / {{ pagination.totalPages }}
          </p>
          <Pagination
            v-slot="{ page }"
            :page="currentPage"
            :total="pagination.total"
            :items-per-page="itemsPerPage"
            :sibling-count="1"
            show-edges
            @update:page="(p) => currentPage = p"
          >
            <PaginationContent class="flex items-center gap-1">
              <PaginationFirst />
              <PaginationPrevious />
              <template v-for="(item, index) in page.items" :key="index">
                <PaginationItem v-if="item.type === 'page'" :value="item.value" as-child>
                  <Button
                    :variant="item.value === currentPage ? 'default' : 'outline'"
                    size="icon"
                    class="h-9 w-9"
                  >
                    {{ item.value }}
                  </Button>
                </PaginationItem>
                <PaginationEllipsis v-else :index="index" />
              </template>
              <PaginationNext />
              <PaginationLast />
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
