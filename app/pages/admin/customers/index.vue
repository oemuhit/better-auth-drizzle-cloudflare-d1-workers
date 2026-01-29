<script setup lang="ts">
import { Eye, Mail } from "lucide-vue-next";
import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";

definePageMeta({
  layout: "admin",
});

useHead({
  title: "Müşteriler | Admin",
});

// Fetch customers (users)
const { data: customersData } = await useFetch("/api/admin/customers");

const customers = computed(() => customersData.value?.data || []);

function formatDate(date: number | Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// Table columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "İsim",
    cell: ({ row }) =>
      h("span", { class: "font-medium" }, row.original.name || "-"),
  },
  {
    accessorKey: "email",
    header: "E-posta",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(Mail, { class: "h-4 w-4 text-muted-foreground" }),
        h("span", {}, row.original.email),
      ]),
  },
  {
    accessorKey: "createdAt",
    header: "Kayıt Tarihi",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "orderCount",
    header: "Sipariş Sayısı",
    cell: ({ row }) =>
      h(
        "span",
        { class: "font-medium" },
        row.original.orderCount?.toString() || "0",
      ),
  },
  {
    accessorKey: "totalSpent",
    header: "Toplam Harcama",
    cell: ({ row }) => {
      const total = row.original.totalSpent || 0;
      return h(
        "span",
        { class: "font-medium" },
        new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
        }).format(total),
      );
    },
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
          onClick: () => navigateTo(`/admin/customers/${row.original.id}`),
        },
        () => h(Eye, { class: "h-4 w-4" }),
      );
    },
    enableSorting: false,
  },
];
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Müşteriler</h1>
      <p class="text-muted-foreground">
        {{ customers.length }} müşteri listeleniyor
      </p>
    </div>

    <Card>
      <CardContent class="pt-6">
        <DataTable
          :columns="columns"
          :data="customers"
          search-placeholder="Müşteri ara..."
        />
      </CardContent>
    </Card>
  </div>
</template>
