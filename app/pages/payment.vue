<script setup lang="ts">
import { Loader2, AlertCircle, ArrowLeft } from "lucide-vue-next";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

useHead({
  title: "Ödeme",
});

const route = useRoute();

// Get payment data from query params (stored in sessionStorage)
const paymentData = ref<{
  token: string;
  checkoutFormContent: string;
  paymentPageUrl: string;
  total: number;
} | null>(null);

const isLoading = ref(true);
const error = ref<string | null>(null);
const formLoaded = ref(false);

onMounted(() => {
  // Get payment data from sessionStorage
  const storedData = sessionStorage.getItem("iyzicoPayment");
  if (storedData) {
    try {
      paymentData.value = JSON.parse(storedData);
      // Clear after reading
      sessionStorage.removeItem("iyzicoPayment");

      // Inject the checkout form script
      if (paymentData.value?.checkoutFormContent) {
        nextTick(() => {
          injectCheckoutForm();
        });
      }
    } catch (e) {
      error.value = "Ödeme bilgileri okunamadı";
    }
  } else {
    error.value = "Ödeme bilgileri bulunamadı";
  }
  isLoading.value = false;
});


function injectCheckoutForm() {
  const container = document.getElementById("iyzipay-checkout-form");
  if (!container || !paymentData.value?.checkoutFormContent) return;

  container.innerHTML = paymentData.value.checkoutFormContent;

  const scripts = container.getElementsByTagName("script");
  Array.from(scripts).forEach((oldScript) => {
    const newScript = document.createElement("script");
    [...oldScript.attributes].forEach(attr =>
      newScript.setAttribute(attr.name, attr.value)
    );
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });

  formLoaded.value = true;
}

function injectCheckoutForm2() {
  const container = document.getElementById("iyzipay-checkout-form");
  if (!container || !paymentData.value?.checkoutFormContent) return;

  // iyzico responsive mode - form will be embedded in the div
  // The div with id="iyzipay-checkout-form" is required for embedded mode

  // Create a temporary container to parse the script content
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = paymentData.value.checkoutFormContent;

  // Find and execute any script tags
  const scripts = tempDiv.getElementsByTagName("script");
  Array.from(scripts).forEach((oldScript) => {
    const newScript = document.createElement("script");
    if (oldScript.src) {
      newScript.src = oldScript.src;
    } else {
      newScript.textContent = oldScript.textContent;
    }
    newScript.type = oldScript.type || "text/javascript";
    document.head.appendChild(newScript);
  });

  // Mark as loaded after a short delay
  setTimeout(() => {
    formLoaded.value = true;
  }, 1000);
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Back Button -->
    <Button variant="ghost" class="mb-4" @click="navigateTo('/checkout')">
      <ArrowLeft class="h-4 w-4 mr-2" />
      Ödemeye Geri Dön
    </Button>

    <h1 class="text-3xl font-bold mb-8">Ödeme</h1>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <span class="ml-2">Ödeme formu yükleniyor...</span>
    </div>

    <!-- Error State -->
    <Card v-else-if="error" class="max-w-md mx-auto">
      <CardContent class="pt-6">
        <div class="text-center">
          <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 class="text-lg font-semibold mb-2">Hata</h2>
          <p class="text-muted-foreground mb-4">{{ error }}</p>
          <Button @click="navigateTo('/checkout')">Ödeme Sayfasına Dön</Button>
        </div>
      </CardContent>
    </Card>

    <!-- Payment Form -->
    <div v-else-if="paymentData" class="space-y-6">
      <!-- Order Total -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <span class="text-lg">Toplam Tutar:</span>
            <span class="text-2xl font-bold">{{
              formatPrice(paymentData.total)
            }}</span>
          </div>
        </CardContent>
      </Card>

      <!-- iyzico Checkout Form Container -->
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Bilgileri</CardTitle>
          <CardDescription>
            Kredi kartı bilgilerinizi güvenli bir şekilde girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- iyzico responsive form will be embedded here -->
          <!-- IMPORTANT: This div id must be "iyzipay-checkout-form" for embedded mode -->
          <div id="iyzipay-checkout-form"  class="min-h-[500px] relative">
            <!-- Loading placeholder (hidden when form loads) -->
            <div
              v-if="!formLoaded"
              class="absolute inset-0 flex items-center justify-center bg-background"
            >
              <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
              <span class="ml-2 text-muted-foreground"
                >Ödeme formu yükleniyor...</span
              >
            </div>
          </div>

          <!-- Alternative: External payment page link -->
          <div
            v-if="paymentData.paymentPageUrl"
            class="mt-4 pt-4 border-t text-center"
          >
            <p class="text-sm text-muted-foreground mb-2">
              Form yüklenmezse veya sorun yaşarsanız:
            </p>
            <Button
              variant="outline"
              as="a"
              :href="paymentData.paymentPageUrl"
              target="_blank"
            >
              iyzico Ödeme Sayfasına Git
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Security Notice -->
      <div class="text-center text-sm text-muted-foreground">
        <p>🔒 Ödeme işleminiz iyzico güvencesiyle gerçekleştirilmektedir.</p>
        <p>Kart bilgileriniz sitemizde saklanmaz.</p>
      </div>
    </div>
  </div>
</template>
