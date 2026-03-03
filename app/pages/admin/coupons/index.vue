<script setup lang="ts">
import { Plus, Pencil, Trash2, Ticket } from "lucide-vue-next";
import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import { toast } from "vue-sonner";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useHead({
  title: "İndirim Kuponları | Admin",
});

const { data: couponsData, refresh } = await useFetch("/api/admin/coupons", {
  query: { limit: 100 },
});

const coupons = computed(() => couponsData.value?.data || []);

const confirmDeleteId = ref<string | null>(null);
const isDeleteDialogOpen = ref(false);

function openDeleteDialog(id: string) {
  confirmDeleteId.value = id;
  isDeleteDialogOpen.value = true;
}

async function handleDelete() {
  if (!confirmDeleteId.value) return;

  try {
    await $fetch(`/api/admin/coupons/${confirmDeleteId.value}`, { method: "DELETE" });
    toast.success("Kupon silindi");
    await refresh();
  } catch (error: any) {
    toast.error(error.data?.statusMessage || "Kupon silinemedi");
  } finally {
    isDeleteDialogOpen.value = false;
    confirmDeleteId.value = null;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "code",
    header: "Kupon Kodu",
    cell: ({ row }) => h("span", { class: "font-mono font-bold text-primary" }, row.original.code),
  },
  {
    accessorKey: "discountValue",
    header: "İndirim",
    cell: ({ row }) => {
      const type = row.original.discountType;
      const value = row.original.discountValue;
      return type === "percentage" ? `%${value}` : formatCurrency(value);
    },
  },
  {
    accessorKey: "isActive",
    header: "Durum",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return h(
        "span",
        { class: `px-2 py-1 rounded-full text-xs ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}` },
        isActive ? "Aktif" : "Pasif"
      );
    },
  },
  {
    accessorKey: "limits",
    header: "Limitler",
    cell: ({ row }) => {
      const parts = [];
      if (row.original.isNewUserOnly) parts.push("Yeni Üye");
      if (row.original.isFirstPurchaseOnly) parts.push("İlk Alışveriş");
      if (row.original.usageLimitPerUser) parts.push(`Kişi başı: ${row.original.usageLimitPerUser}`);
      return parts.join(", ") || "Limit Yok";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Oluşturulma",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("tr-TR"),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-2" }, [
        h(
          resolveComponent("Button"),
          {
            variant: "ghost",
            size: "icon",
            class: "h-8 w-8",
            onClick: () => navigateTo(`/admin/coupons/${row.original.id}`),
          },
          () => h(Pencil, { class: "h-4 w-4" })
        ),
        h(
          resolveComponent("Button"),
          {
            variant: "ghost",
            size: "icon",
            class: "h-8 w-8 text-destructive",
            onClick: () => openDeleteDialog(row.original.id),
          },
          () => h(Trash2, { class: "h-4 w-4" })
        ),
      ]);
    },
    enableSorting: false,
  },
];
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
           <Ticket class="h-8 w-8 text-primary" />
           İndirim Kuponları
        </h1>
        <p class="text-muted-foreground">
          {{ coupons.length }} kupon tanımlı
        </p>
      </div>
      <Button as-child>
        <NuxtLink to="/admin/coupons/new" class="flex items-center gap-2">
          <Plus class="h-4 w-4" />
          Yeni Kupon
        </NuxtLink>
      </Button>
    </div>

    <Card>
      <CardContent class="pt-6">
        <DataTable
          :columns="columns"
          :data="coupons"
          search-placeholder="Kupon kodu ara..."
        />
      </CardContent>
    </Card>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kuponu silmek istediğinize emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. Bu kuponu kalıcı olarak silecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
