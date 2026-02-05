<script setup lang="ts">
import { ChevronLeft } from "lucide-vue-next";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useHead({
  title: "Yeni Ürün | Admin",
});

// Fetch categories
const { data: categoriesData } = await useFetch("/api/categories", {
  query: { includeInactive: true },
});

const categories = computed(() => categoriesData.value?.data || []);

const formRef = ref<any>(null);

async function handleSubmit(formData: any) {
  try {
    await $fetch("/api/products", {
      method: "POST",
      body: {
        ...formData,
        categoryId: formData.categoryId === "none" ? null : formData.categoryId,
        taxRateId: formData.taxRateId === "none" ? null : formData.taxRateId,
      },
    });
    navigateTo("/admin/products");
  } catch (error: any) {
    const message = error.data?.statusMessage || "Ürün oluşturulamadı";
    formRef.value?.setServerError(message);
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
        <h1 class="text-3xl font-bold">Yeni Ürün</h1>
        <p class="text-muted-foreground">Yeni bir ürün oluşturun</p>
      </div>
    </div>

    <ProductForm
      ref="formRef"
      :categories="categories as any"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
