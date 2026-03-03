<script setup lang="ts">
import { ChevronLeft } from "lucide-vue-next";
import { toast } from "vue-sonner";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useHead({
  title: "Yeni Kupon | Admin",
});

const formRef = ref<any>(null);

async function handleSubmit(formData: any) {
  try {
    await $fetch("/api/admin/coupons", {
      method: "POST",
      body: formData,
    });
    toast.success("Kupon oluşturuldu");
    navigateTo("/admin/coupons");
  } catch (error: any) {
    const message = error.data?.statusMessage || "Kupon oluşturulamadı";
    formRef.value?.setServerError(message);
  }
}

function handleCancel() {
  navigateTo("/admin/coupons");
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        @click="navigateTo('/admin/coupons')"
      >
        <ChevronLeft class="h-5 w-5" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold">Yeni Kupon</h1>
        <p class="text-muted-foreground">İndirim kuponu oluşturun</p>
      </div>
    </div>

    <CouponForm
      ref="formRef"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
