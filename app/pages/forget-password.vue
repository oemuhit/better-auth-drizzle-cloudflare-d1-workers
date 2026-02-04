<script lang="ts" setup>
import { Leaf, AlertCircle, Loader2 } from "lucide-vue-next"
import { requestPasswordReset } from "~/lib/auth-client"

definePageMeta({
  layout: false
})

const email = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const handleRequestPasswordReset = async () => {
  if (!email.value) {
    error.value = "Lütfen e-posta adresinizi girin";
    return;
  }
  
  error.value = null;
  isLoading.value = true;
  
  await requestPasswordReset(
    {
      email: email.value,
      redirectTo: "/reset-password",
    },
    {
      onSuccess() {
        isLoading.value = false;
        success.value = true;
      },
      onError(context) {
        isLoading.value = false;
        error.value = context.error.message;
      },
    }
  );
};
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <div class="flex flex-col gap-4 p-6 md:p-10">
      <div class="flex justify-center gap-2 md:justify-start">
        <NuxtLink to="/" class="flex items-center gap-2 font-medium">
          <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Leaf class="size-4" />
          </div>
          Organik Market
        </NuxtLink>
      </div>
      <div class="flex flex-1 items-center justify-center">
        <div class="w-full max-w-xs">
          <form class="flex flex-col gap-6" @submit.prevent="handleRequestPasswordReset">
            <FieldGroup>
              <div class="flex flex-col items-center gap-1 text-center">
                <h1 class="text-2xl font-bold">
                  Şifremi Unuttum
                </h1>
                <p class="text-muted-foreground text-sm text-balance">
                  Şifrenizi sıfırlamak için e-posta adresinizi girin
                </p>
              </div>

              <!-- Success Alert -->
              <Alert v-if="success" class="border-green-500/50 text-green-600 dark:text-green-400">
                <Leaf class="h-4 w-4" />
                <AlertTitle>Başarılı</AlertTitle>
                <AlertDescription>Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.</AlertDescription>
              </Alert>
              
              <!-- Error Alert -->
              <Alert v-if="error" variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{{ error }}</AlertDescription>
              </Alert>

              <Field v-if="!success">
                <FieldLabel for="email">E-posta</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  v-model="email"
                  :disabled="isLoading"
                  required
                />
              </Field>

              <Field v-if="!success">
                <Button type="submit" :disabled="isLoading || !email">
                  <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                  {{ isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder' }}
                </Button>
              </Field>

              <Field>
                <div class="text-center text-sm">
                  <NuxtLink to="/sign-in" class="underline underline-offset-4 hover:text-primary">
                    Giriş ekranına geri dön
                  </NuxtLink>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
    <div class="bg-muted relative hidden lg:block">
      <img
        src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"
        alt="Organik Ürünler"
        class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      >
    </div>
  </div>
</template>
