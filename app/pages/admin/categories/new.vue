<script setup lang="ts">
import { ChevronLeft, Loader2 } from "lucide-vue-next";

definePageMeta({
  layout: "admin",
});

useHead({
  title: "Yeni Kategori | Admin",
});

// Fetch parent categories
const { data: categoriesData } = await useFetch("/api/categories", {
  query: { parentOnly: true },
});

const parentCategories = computed(() => categoriesData.value?.data || []);

// Form state
const formData = reactive({
  title: "",
  slug: "",
  parentCategoryId: "none",
  isActive: true,
  image: null as string | null,
});

const isSubmitting = ref(false);
const error = ref<string | null>(null);

// Auto-generate slug
watch(
  () => formData.title,
  (title) => {
    formData.slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  },
);

async function handleSubmit() {
  if (!formData.title) {
    error.value = "Kategori adı gerekli";
    return;
  }

  isSubmitting.value = true;
  error.value = null;

  try {
    await $fetch("/api/categories", {
      method: "POST",
      body: {
        ...formData,
        parentCategoryId:
          formData.parentCategoryId === "none"
            ? null
            : formData.parentCategoryId || null,
      },
    });
    navigateTo("/admin/categories");
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Kategori oluşturulamadı";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        @click="navigateTo('/admin/categories')"
      >
        <ChevronLeft class="h-5 w-5" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold">Yeni Kategori</h1>
        <p class="text-muted-foreground">Yeni bir kategori oluşturun</p>
      </div>
    </div>

    <Card class="max-w-2xl">
      <CardHeader>
        <CardTitle>Kategori Bilgileri</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="title">Kategori Adı *</Label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="Kategori adı"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="slug">Slug</Label>
            <Input
              id="slug"
              v-model="formData.slug"
              placeholder="kategori-adi"
            />
          </div>

          <div class="space-y-2">
            <Label for="parent">Üst Kategori</Label>
            <Select v-model="formData.parentCategoryId">
              <SelectTrigger>
                <SelectValue placeholder="Üst kategori seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ana Kategori</SelectItem>
                <SelectItem
                  v-for="cat in parentCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.title }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label>Kategori Resmi</Label>
            <div class="flex items-center gap-4">
              <div v-if="formData.image" class="relative group">
                <NuxtImg
                  :src="formData.image"
                  preset="avatar"
                  class="h-20 w-20 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="formData.image = null"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
              <div class="flex-1 max-w-xs">
                <FileUpload @onUploadComplete="(id) => formData.image = id" />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input
              id="is-active"
              v-model="formData.isActive"
              type="checkbox"
              class="h-4 w-4"
            />
            <label for="is-active">Aktif</label>
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

          <div class="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              @click="navigateTo('/admin/categories')"
            >
              İptal
            </Button>
            <Button type="submit" :disabled="isSubmitting || !formData.title">
              <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
              Oluştur
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
