<script setup lang="ts">
import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-vue-next";
import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";

definePageMeta({
  layout: "admin",
});

useHead({
  title: "Ürünler | Admin",
});

// Fetch products
const { data: productsData, refresh } = await useFetch("/api/products", {
  query: { includeAll: true, limit: 100 },
});

const products = computed(() => productsData.value?.data || []);

const confirmDeleteId = ref<string | null>(null);
const isDeleteDialogOpen = ref(false);

function openDeleteDialog(id: string) {
  confirmDeleteId.value = id;
  isDeleteDialogOpen.value = true;
}

// Delete product
async function handleDelete() {
  if (!confirmDeleteId.value) return;

  try {
    await $fetch(`/api/products/${confirmDeleteId.value}`, { method: "DELETE" });
    await refresh();
  } catch (error: any) {
    alert(error.data?.statusMessage || "Ürün silinemedi");
  } finally {
    isDeleteDialogOpen.value = false;
    confirmDeleteId.value = null;
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

// Table columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: "thumbnail",
    header: "",
    cell: ({ row }) => {
      return h("img", {
        src: row.original.thumbnail || "/placeholder-product.jpg",
        alt: row.original.title,
        class: "w-10 h-10 rounded object-cover",
      });
    },
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: "Ürün Adı",
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.title),
  },
  {
    accessorKey: "category",
    header: "Kategori",
    cell: ({ row }) => row.original.category?.title || "-",
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status;
      const statusMap: Record<string, { label: string; class: string }> = {
        active: { label: "Aktif", class: "bg-green-100 text-green-800" },
        inactive: { label: "Pasif", class: "bg-gray-100 text-gray-800" },
        out_of_stock: { label: "Stokta Yok", class: "bg-red-100 text-red-800" },
        hidden: { label: "Gizli", class: "bg-yellow-100 text-yellow-800" },
      };
      const config = statusMap[status] || {
        label: status,
        class: "bg-gray-100",
      };
      return h(
        "span",
        { class: `px-2 py-1 rounded-full text-xs ${config.class}` },
        config.label,
      );
    },
  },
  {
    accessorKey: "variants",
    header: "Varyant",
    cell: ({ row }) => `${row.original.variants?.length || 0} adet`,
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
            onClick: () => navigateTo(`/shop/${row.original.slug}`),
          },
          () => h(Eye, { class: "h-4 w-4" }),
        ),
        h(
          resolveComponent("Button"),
          {
            variant: "ghost",
            size: "icon",
            class: "h-8 w-8",
            onClick: () =>
              navigateTo(`/admin/products/${row.original.id}/edit`),
          },
          () => h(Pencil, { class: "h-4 w-4" }),
        ),
        h(
          resolveComponent("Button"),
          {
            variant: "ghost",
            size: "icon",
            class: "h-8 w-8 text-destructive",
            onClick: () => openDeleteDialog(row.original.id),
          },
          () => h(Trash2, { class: "h-4 w-4" }),
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
        <h1 class="text-3xl font-bold">Ürünler</h1>
        <p class="text-muted-foreground">
          {{ products.length }} ürün listeleniyor
        </p>
      </div>
      <Button>
        <NuxtLink to="/admin/products/new" class="flex items-center gap-2">
          <Plus class="h-4 w-4" />
          Yeni Ürün
        </NuxtLink>
      </Button>
    </div>

    <Card>
      <CardContent class="pt-6">
        <DataTable
          :columns="columns"
          :data="products"
          search-placeholder="Ürün ara..."
        />
      </CardContent>
    </Card>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ürünü silmek istediğinize emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. Bu ürünü kalıcı olarak silecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">İptal</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
