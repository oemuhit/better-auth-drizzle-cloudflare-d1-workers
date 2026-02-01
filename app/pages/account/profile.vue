<script setup lang="ts">
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

definePageMeta({
  layout: "account",
  middleware: "auth",
});

const { data: profileResponse, refresh } = await useFetch("/api/user/profile");

const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi girin"),
  })
);

const { handleSubmit, isSubmitting, errors, values, setValues } = useForm({
  validationSchema: schema,
  initialValues: {
    name: profileResponse.value?.data.user.name || "",
    email: profileResponse.value?.data.user.email || "",
  },
});

const updateSuccess = ref(false);
const updateError = ref<string | null>(null);

const onSubmit = handleSubmit(async (values) => {
  updateSuccess.value = false;
  updateError.value = null;

  try {
    await $fetch("/api/user/profile", {
      method: "PATCH",
      body: { name: values.name },
    });
    updateSuccess.value = true;
    await refresh();
  } catch (err: any) {
    updateError.value = err.data?.statusMessage || "Profil güncellenemedi";
  }
});

// Watch for profile data changes to update form
watch(profileResponse, (newVal) => {
  if (newVal?.data.user) {
    setValues({
      name: newVal.data.user.name,
      email: newVal.data.user.email,
    });
  }
}, { immediate: true });

useHead({
  title: "Kişisel Bilgiler | Hesabım",
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Kişisel Bilgiler</h1>
      <p class="text-muted-foreground">Profil bilgilerinizi yönetin</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Profil Bilgisi</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" class="space-y-4">
          <div v-if="updateSuccess" class="bg-primary/10 text-primary p-3 rounded-md flex items-center gap-2 text-sm">
            <CheckCircle2 class="h-4 w-4" />
            Profiliniz başarıyla güncellendi.
          </div>

          <div v-if="updateError" class="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle class="h-4 w-4" />
            {{ updateError }}
          </div>

          <div class="grid gap-2">
            <Label for="name">Ad Soyad</Label>
            <Input id="name" v-model="values.name" :disabled="isSubmitting" />
            <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
          </div>

          <div class="grid gap-2">
            <Label for="email">E-posta Adresi</Label>
            <Input id="email" v-model="values.email" disabled type="email" class="bg-muted opacity-70" />
            <p class="text-[10px] text-muted-foreground">E-posta adresi değiştirilemez.</p>
          </div>

          <Button type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            Değişiklikleri Kaydet
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
