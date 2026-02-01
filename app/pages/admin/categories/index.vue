<script setup lang="ts">
import { Plus, Pencil, Trash2 } from "lucide-vue-next";
import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";

definePageMeta({
  layout: "admin",
});

useHead({
  title: "Kategoriler | Admin",
});

// Fetch categories
const { data: categoriesData, refresh } = await useFetch("/api/categories", {
  query: { includeInactive: true },
});

const categories = computed(() => categoriesData.value?.data || []);

// Flatten categories for table
const flatCategories = computed(() => {
  const result: any[] = [];
  for (const cat of categories.value) {
    result.push(cat);
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        result.push({ ...sub, parentTitle: cat.title });
      }
    }
  }
  return result;
});

const confirmDeleteId = ref<string | null>(null);
const isDeleteDialogOpen = ref(false);

function openDeleteDialog(id: string) {
  confirmDeleteId.value = id;
  isDeleteDialogOpen.value = true;
}

// Delete category
async function handleDelete() {
  if (!confirmDeleteId.value) return;

  try {
    await $fetch(`/api/categories/${confirmDeleteId.value}`, { method: "DELETE" });
    await refresh();
  } catch (error: any) {
    alert(error.data?.statusMessage || "Kategori silinemedi");
  } finally {
    isDeleteDialogOpen.value = false;
    confirmDeleteId.value = null;
  }
}

// Edit dialog
const editingCategory = ref<any>(null);
const showEditDialog = ref(false);

function openEditDialog(category: any) {
  editingCategory.value = { ...category };
  showEditDialog.value = true;
}

async function handleSaveEdit() {
  if (!editingCategory.value) return;

  try {
    await $fetch(`/api/categories/${editingCategory.value.id}`, {
      method: "PUT",
      body: {
        title: editingCategory.value.title,
        slug: editingCategory.value.slug,
        isActive: editingCategory.value.isActive,
        image: editingCategory.value.image,
      },
    });
    await refresh();
    showEditDialog.value = false;
    editingCategory.value = null;
  } catch (error: any) {
    alert(error.data?.statusMessage || "Kategori güncellenemedi");
  }
}

// Table columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: "image",
    header: "",
    cell: ({ row }) => {
      const image = row.original.image;
      if (image) {
        return h(resolveComponent("NuxtImg"), {
          src: image,
          preset: "avatar",
          class: "w-10 h-10 rounded object-cover",
        });
      }
      return h("div", { class: "w-10 h-10 rounded bg-muted flex items-center justify-center" }, [
        h("span", { class: "text-[10px] text-muted-foreground" }, "Resim Yok")
      ]);
    },
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: "Kategori Adı",
    cell: ({ row }) => {
      const isSubcategory = !!row.original.parentTitle;
      return h(
        "span",
        { class: isSubcategory ? "pl-6 text-muted-foreground" : "font-medium" },
        isSubcategory ? `└ ${row.original.title}` : row.original.title,
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) =>
      h("code", { class: "text-sm bg-muted px-1 rounded" }, row.original.slug),
  },
  {
    accessorKey: "isActive",
    header: "Durum",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return h(
        "span",
        {
          class: `px-2 py-1 rounded-full text-xs ${
            isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`,
        },
        isActive ? "Aktif" : "Pasif",
      );
    },
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
            onClick: () => openEditDialog(row.original),
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
        <h1 class="text-3xl font-bold">Kategoriler</h1>
        <p class="text-muted-foreground">
          {{ flatCategories.length }} kategori listeleniyor
        </p>
      </div>
      <Button>
        <NuxtLink to="/admin/categories/new" class="flex items-center gap-2">
          <Plus class="h-4 w-4" />
          Yeni Kategori
        </NuxtLink>
      </Button>
    </div>

    <Card>
      <CardContent class="pt-6">
        <DataTable
          :columns="columns"
          :data="flatCategories"
          search-placeholder="Kategori ara..."
        />
      </CardContent>
    </Card>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategori Düzenle</DialogTitle>
        </DialogHeader>
        <div v-if="editingCategory" class="space-y-4">
          <div class="space-y-2">
            <Label>Kategori Adı</Label>
            <Input v-model="editingCategory.title" />
          </div>
          <div class="space-y-2">
            <Label>Slug</Label>
            <Input v-model="editingCategory.slug" />
          </div>
          <div class="flex items-center gap-2">
            <input
              id="is-active"
              v-model="editingCategory.isActive"
              type="checkbox"
              class="h-4 w-4"
            />
            <label for="is-active">Aktif</label>
          </div>

          <div class="space-y-2">
            <Label>Kategori Resmi</Label>
            <div class="flex items-center gap-4">
              <div v-if="editingCategory.image" class="relative group">
                <NuxtImg
                  :src="editingCategory.image"
                  preset="avatar"
                  class="h-16 w-16 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="editingCategory.image = null"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
              <div class="flex-1">
                <FileUpload @onUploadComplete="(id) => editingCategory.image = id" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showEditDialog = false"
            >İptal</Button
          >
          <Button @click="handleSaveEdit">Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kategoriyi silmek istediğinize emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. Bu kategoriyi ve varsa alt kategorilerini kalıcı olarak silecektir.
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
