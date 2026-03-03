<script setup lang="ts">
import { ChevronLeft } from "lucide-vue-next";
import { toast } from "vue-sonner";

definePageMeta({
  layout: "admin",
  middleware: "admin",
});

const route = useRoute();
const id = route.params.id as string;

const { data: couponData, error: fetchError } = await useFetch(`/api/admin/coupons/${id}`);

if (fetchError.value) {
  throw createError({
    statusCode: fetchError.value.statusCode,
    statusMessage: fetchError.value.statusMessage || "Kupon bulunamadı",
  });
}

useHead({
  title: `${couponData.value?.data?.code || 'Kupon Düzenle'} | Admin`,
});

const formRef = ref<any>(null);

async function handleSubmit(formData: any) {
  try {
    await $fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      body: formData,
    });
    toast.success("Kupon güncellendi");
    navigateTo("/admin/coupons");
  } catch (error: any) {
    const message = error.data?.statusMessage || "Kupon güncellenemedi";
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
        <h1 class="text-3xl font-bold">Kuponu Düzenle</h1>
        <p class="text-muted-foreground">{{ couponData?.data?.code }} kodlu kuponu düzenleyin</p>
      </div>
    </div>

    <CouponForm
      v-if="couponData?.data"
      ref="formRef"
      :coupon="couponData.data"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
