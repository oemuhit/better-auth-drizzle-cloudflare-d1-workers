<script setup lang="ts">
import { ChevronLeft, Loader2, MapPin, Plus } from "lucide-vue-next";
import { useSession } from "~/lib/auth-client";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

useHead({
  title: "Ödeme",
});

const { data: session } = await useSession(useFetch);
const { cart, items, subtotal, isEmpty, fetchCart, formatPrice } = useCart();

// Redirect if cart is empty
onMounted(async () => {
  await fetchCart();
  if (isEmpty.value) {
    navigateTo("/cart");
  }
});

// Fetch addresses
const { data: addressesData, refresh: refreshAddresses } =
  await useFetch("/api/addresses");
const addresses = computed(() => addressesData.value?.data || []);

// Form state
const selectedShippingAddressId = ref<string>("");
const selectedBillingAddressId = ref<string>("");
const useSameAddress = ref(true);
const notes = ref("");

// New address dialog
const showAddressDialog = ref(false);
const newAddress = reactive({
  firstName: "",
  lastName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "TR",
  phone: "",
  isDefault: false,
});

// Auto-select default address
watch(
  addresses,
  (addrs) => {
    if (addrs.length > 0 && !selectedShippingAddressId.value) {
      const defaultAddr = addrs.find((a: any) => a.isDefault);
      selectedShippingAddressId.value = defaultAddr?.id || addrs[0].id;
    }
  },
  { immediate: true },
);

// Calculate totals
const shippingTotal = ref(0); // Could be calculated based on address
const taxTotal = computed(() => subtotal.value * 0.18); // 18% KDV
const total = computed(
  () => subtotal.value + taxTotal.value + shippingTotal.value,
);

// Submit state
const isSubmitting = ref(false);
const isAddingAddress = ref(false);
const error = ref<string | null>(null);

async function handleAddAddress() {
  if (isAddingAddress.value) return; // Prevent double submission

  isAddingAddress.value = true;
  error.value = null;

  try {
    await $fetch("/api/addresses", {
      method: "POST",
      body: newAddress,
    });
    await refreshAddresses();
    showAddressDialog.value = false;
    // Reset form
    Object.assign(newAddress, {
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      phone: "",
      isDefault: false,
    });
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Adres eklenemedi";
  } finally {
    isAddingAddress.value = false;
  }
}

async function handleSubmitOrder() {
  if (!selectedShippingAddressId.value) {
    error.value = "Lütfen bir teslimat adresi seçin";
    return;
  }

  isSubmitting.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ success: boolean; data: { id: string } }>(
      "/api/orders",
      {
        method: "POST",
        body: {
          shippingAddressId: selectedShippingAddressId.value,
          billingAddressId: useSameAddress.value
            ? selectedShippingAddressId.value
            : selectedBillingAddressId.value,
          taxTotal: taxTotal.value,
          shippingTotal: shippingTotal.value,
          notes: notes.value || undefined,
        },
      },
    );

    if (response.success) {
      navigateTo(`/orders/${response.data.id}`);
    }
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Sipariş oluşturulamadı";
  } finally {
    isSubmitting.value = false;
  }
}

function getAddressDisplay(address: any) {
  return `${address.addressLine1}, ${address.city} ${address.postalCode}`;
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <Button variant="ghost" class="mb-4" @click="navigateTo('/cart')">
      <ChevronLeft class="h-4 w-4 mr-2" />
      Sepete Dön
    </Button>

    <h1 class="text-3xl font-bold mb-8">Ödeme</h1>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Checkout Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Shipping Address -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <MapPin class="h-5 w-5" />
              Teslimat Adresi
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="addresses.length === 0" class="text-center py-4">
              <p class="text-muted-foreground mb-4">Henüz adres eklemediniz</p>
              <Button @click="showAddressDialog = true">
                <Plus class="h-4 w-4 mr-2" />
                Adres Ekle
              </Button>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="address in addresses"
                :key="address.id"
                class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
                :class="[
                  selectedShippingAddressId === address.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground',
                ]"
                @click="selectedShippingAddressId = address.id"
              >
                <input
                  type="radio"
                  :checked="selectedShippingAddressId === address.id"
                  class="mt-1"
                />
                <div class="flex-1">
                  <p class="font-medium">
                    {{ address.firstName }} {{ address.lastName }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ getAddressDisplay(address) }}
                  </p>
                  <p v-if="address.phone" class="text-sm text-muted-foreground">
                    {{ address.phone }}
                  </p>
                </div>
                <Badge v-if="address.isDefault" variant="secondary"
                  >Varsayılan</Badge
                >
              </div>

              <Button
                variant="outline"
                class="w-full"
                @click="showAddressDialog = true"
              >
                <Plus class="h-4 w-4 mr-2" />
                Yeni Adres Ekle
              </Button>
            </div>

            <!-- Same address checkbox -->
            <div class="flex items-center gap-2 pt-4 border-t">
              <input
                id="same-address"
                v-model="useSameAddress"
                type="checkbox"
                class="h-4 w-4"
              />
              <label for="same-address" class="text-sm">
                Fatura adresi teslimat adresiyle aynı
              </label>
            </div>
          </CardContent>
        </Card>

        <!-- Billing Address (if different) -->
        <Card v-if="!useSameAddress">
          <CardHeader>
            <CardTitle>Fatura Adresi</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="address in addresses"
                :key="address.id"
                class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
                :class="[
                  selectedBillingAddressId === address.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground',
                ]"
                @click="selectedBillingAddressId = address.id"
              >
                <input
                  type="radio"
                  :checked="selectedBillingAddressId === address.id"
                  class="mt-1"
                />
                <div>
                  <p class="font-medium">
                    {{ address.firstName }} {{ address.lastName }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ getAddressDisplay(address) }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Order Notes -->
        <Card>
          <CardHeader>
            <CardTitle>Sipariş Notu (İsteğe bağlı)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              v-model="notes"
              placeholder="Sipariş hakkında notunuz varsa yazabilirsiniz..."
              rows="3"
            />
          </CardContent>
        </Card>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <Card class="sticky top-4">
          <CardHeader>
            <CardTitle>Sipariş Özeti</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Items -->
            <div class="space-y-3 max-h-64 overflow-auto">
              <div
                v-for="item in items"
                :key="item.id"
                class="flex gap-3 text-sm"
              >
                <img
                  :src="
                    item.product.images?.[0]?.url || '/placeholder-product.jpg'
                  "
                  :alt="item.product.title"
                  class="w-12 h-12 rounded object-cover"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ item.product.title }}</p>
                  <p class="text-muted-foreground">x{{ item.quantity }}</p>
                </div>
                <p class="font-medium">{{ formatPrice(item.itemTotal) }}</p>
              </div>
            </div>

            <Separator />

            <!-- Totals -->
            <CartSummary
              :subtotal="subtotal"
              :tax-total="taxTotal"
              :shipping-total="shippingTotal"
              show-details
            />

            <!-- Error -->
            <p v-if="error" class="text-sm text-destructive">
              {{ error }}
            </p>

            <!-- Submit Button -->
            <Button
              class="w-full"
              size="lg"
              :disabled="isSubmitting || !selectedShippingAddressId"
              @click="handleSubmitOrder"
            >
              <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
              Siparişi Onayla
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Add Address Dialog -->
    <Dialog v-model:open="showAddressDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Adres Ekle</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="handleAddAddress" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>Ad</Label>
              <Input v-model="newAddress.firstName" placeholder="Ad" />
            </div>
            <div class="space-y-2">
              <Label>Soyad</Label>
              <Input v-model="newAddress.lastName" placeholder="Soyad" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>Adres Satırı 1 *</Label>
            <Input
              v-model="newAddress.addressLine1"
              placeholder="Adres"
              required
            />
          </div>
          <div class="space-y-2">
            <Label>Adres Satırı 2</Label>
            <Input
              v-model="newAddress.addressLine2"
              placeholder="Apartman, daire vb."
            />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>Şehir *</Label>
              <Input v-model="newAddress.city" placeholder="Şehir" required />
            </div>
            <div class="space-y-2">
              <Label>İlçe</Label>
              <Input v-model="newAddress.state" placeholder="İlçe" />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label>Posta Kodu *</Label>
              <Input
                v-model="newAddress.postalCode"
                placeholder="Posta kodu"
                required
              />
            </div>
            <div class="space-y-2">
              <Label>Telefon</Label>
              <Input v-model="newAddress.phone" placeholder="Telefon" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              id="default-address"
              v-model="newAddress.isDefault"
              type="checkbox"
              class="h-4 w-4"
            />
            <label for="default-address" class="text-sm"
              >Varsayılan adres olarak kaydet</label
            >
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              :disabled="isAddingAddress"
              @click="showAddressDialog = false"
            >
              İptal
            </Button>
            <Button type="submit" :disabled="isAddingAddress">
              <Loader2
                v-if="isAddingAddress"
                class="h-4 w-4 mr-2 animate-spin"
              />
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
