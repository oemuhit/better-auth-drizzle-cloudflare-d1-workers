<script setup lang="ts">
import { ChevronLeft } from "lucide-vue-next";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const id = computed(() => route.params.id as string);

// Fetch product
const { data: productData, error } = await useFetch(
  `/api/products/${id.value}`,
);

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Ürün bulunamadı",
  });
}

const product = computed(() => productData.value?.data);

useHead({
  title: computed(() =>
    product.value ? `${product.value.title} Düzenle | Admin` : "Ürün Düzenle",
  ),
});

// Fetch categories
const { data: categoriesData } = await useFetch("/api/categories", {
  query: { includeInactive: true },
});

const categories = computed(() => categoriesData.value?.data || []);

async function handleSubmit(formData: any) {
  try {
    await $fetch(`/api/products/${id.value}`, {
      method: "PUT",
      body: {
        ...formData,
        categoryId: formData.categoryId === "none" ? null : formData.categoryId,
      },
    });
    navigateTo("/admin/products");
  } catch (error: any) {
    alert(error.data?.statusMessage || "Ürün güncellenemedi");
  }
}

function handleCancel() {
  navigateTo("/admin/products");
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        @click="navigateTo('/admin/products')"
      >
        <ChevronLeft class="h-5 w-5" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold">Ürün Düzenle</h1>
        <p class="text-muted-foreground">{{ product?.title }}</p>
      </div>
    </div>

    <ProductForm
      v-if="product"
      :product="product"
      :categories="categories"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
