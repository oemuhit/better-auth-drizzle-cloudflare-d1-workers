<script setup lang="ts">
import { ChevronLeft, Loader2 as LucideLoader2, MapPin, Plus, Pencil } from "lucide-vue-next";
import { useSession } from "~/lib/auth-client";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { addressSchema as rawAddressSchema } from "../../server/utils/validation";

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
const editingAddressId = ref<string | null>(null);

const addressSchema = toTypedSchema(rawAddressSchema);

const { handleSubmit: handleAddAddress, resetForm, errors, defineField, meta, isSubmitting: isAddingAddress } = useForm({
  validationSchema: addressSchema,
  initialValues: {
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
  }
});

const [firstName] = defineField('firstName');
const [lastName] = defineField('lastName');
const [addressLine1] = defineField('addressLine1');
const [addressLine2] = defineField('addressLine2');
const [city] = defineField('city');
const [state] = defineField('state');
const [postalCode] = defineField('postalCode');
const [phone] = defineField('phone');
const [countryCode] = defineField('countryCode');
const [isDefault] = defineField('isDefault');

// Auto-select default address
watch(
  addresses,
  (addrs) => {
    if (addrs.length > 0 && !selectedShippingAddressId.value) {
      const defaultAddr = addrs.find((a: any) => a.isDefault);
      selectedShippingAddressId.value = defaultAddr?.id || addrs[0]?.id || "";
    }
  },
  { immediate: true },
);

const onAddAddress = handleAddAddress(async (values: any) => {
  error.value = null;

  try {
    if (editingAddressId.value) {
      await $fetch(`/api/user/addresses/${editingAddressId.value}`, {
        method: "PATCH",
        body: values,
      });
    } else {
      await $fetch("/api/addresses", {
        method: "POST",
        body: values,
      });
    }
    await refreshAddresses();
    showAddressDialog.value = false;
    resetForm();
    editingAddressId.value = null;
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Adres kaydedilemedi";
  }
});

function startAddAddress() {
  editingAddressId.value = null;
  resetForm();
  showAddressDialog.value = true;
}

function startEditAddress(address: any) {
  editingAddressId.value = address.id;
  resetForm({
    values: {
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      phone: address.phone || "",
      countryCode: address.countryCode || "TR",
      isDefault: address.isDefault || false,
    }
  });
  showAddressDialog.value = true;
}

// Calculate totals - prices already include tax (KDV dahil)
const shippingTotal = ref(0); // Could be calculated based on address

// Calculate tax included in prices (for invoice purposes only)
// Formula: taxAmount = price * (taxRate / (1 + taxRate))
const taxBreakdown = computed(() => {
  let totalTax = 0;
  for (const item of items.value) {
    // Default to 18% if no tax rate specified
    const taxRate = (item.product as any)?.taxRate?.rate ?? 18;
    const itemTotal = item.itemTotal || 0;
    // Extract tax from inclusive price
    const taxAmount = itemTotal * (taxRate / (100 + taxRate));
    totalTax += taxAmount;
  }
  return totalTax;
});

// Total is just subtotal + shipping (tax is already included in prices)
const total = computed(() => subtotal.value + shippingTotal.value);

// Submit state
const isSubmitting = ref(false);
const error = ref<string | null>(null);

// Check for payment errors from callback
const route = useRoute();
onMounted(() => {
  const queryError = route.query.error as string;
  const queryMessage = route.query.message as string;

  if (queryError) {
    error.value = queryMessage || getErrorMessage(queryError);
    // Clean up URL
    navigateTo("/checkout", { replace: true });
  }
});

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    missing_token: "Ödeme bilgileri eksik",
    payment_failed: "Ödeme başarısız oldu",
    missing_basket: "Sepet bilgisi bulunamadı",
    cart_not_found: "Sepet bulunamadı",
    callback_error: "Ödeme işlemi sırasında bir hata oluştu",
  };
  return messages[errorCode] || "Bilinmeyen bir hata oluştu";
}

// Check for payment errors from callback

async function handleSubmitOrder() {
  if (!selectedShippingAddressId.value) {
    error.value = "Lütfen bir teslimat adresi seçin";
    return;
  }

  isSubmitting.value = true;
  error.value = null;

  try {
    // Initialize iyzico payment
    const response = await $fetch<{
      success: boolean;
      data: {
        token: string;
        checkoutFormContent: string;
        paymentPageUrl: string;
        total: number;
      };
    }>("/api/payment/iyzico/init", {
      method: "POST",
      body: {
        shippingAddressId: selectedShippingAddressId.value,
        billingAddressId: useSameAddress.value
          ? selectedShippingAddressId.value
          : selectedBillingAddressId.value,
        notes: notes.value || undefined,
      },
    });

    if (response.success && response.data) {
      // Store payment data in sessionStorage for the payment page
      sessionStorage.setItem("iyzicoPayment", JSON.stringify(response.data));
      // Navigate to payment page
      navigateTo("/payment");
    }
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Ödeme başlatılamadı";
  } finally {
    isSubmitting.value = false;
  }
}

function getAddressDisplay(address: any) {
  return `${address.addressLine1}, ${address.city} ${address.postalCode}`;
}
const img = useImage();

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
              <Button @click="startAddAddress">
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
                <div class="flex flex-col items-end gap-2">
                  <Badge v-if="address.isDefault" variant="secondary">Varsayılan</Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8"
                    @click.stop="startEditAddress(address)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                class="w-full"
                @click="startAddAddress"
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
                <div class="flex-1">
                  <p class="font-medium">
                    {{ address.firstName }} {{ address.lastName }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ getAddressDisplay(address) }}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8"
                  @click.stop="startEditAddress(address)"
                >
                  <Pencil class="h-4 w-4" />
                </Button>
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
                    img(item.product.images?.[0]?.url||'',{width:256}) || '/placeholder-product.avif'
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
              :tax-total="taxBreakdown"
              :shipping-total="shippingTotal"
              :total="total"
              show-details
              tax-inclusive
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
              <LucideLoader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
              {{ isSubmitting ? "İşleniyor..." : "Ödemeye Geç" }}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Add Address Dialog -->
    <Dialog v-model:open="showAddressDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingAddressId ? 'Adresi Düzenle' : 'Yeni Adres Ekle' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="onAddAddress" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="firstName">Ad</Label>
              <Input id="firstName" v-model="firstName" placeholder="Ad" :class="{'border-destructive': errors.firstName}" />
              <p v-if="errors.firstName" class="text-xs text-destructive font-medium">{{ errors.firstName }}</p>
            </div>
            <div class="space-y-2">
              <Label for="lastName">Soyad</Label>
              <Input id="lastName" v-model="lastName" placeholder="Soyad" :class="{'border-destructive': errors.lastName}" />
              <p v-if="errors.lastName" class="text-xs text-destructive font-medium">{{ errors.lastName }}</p>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="addressLine1">Adres Satırı 1 *</Label>
            <Input
              id="addressLine1"
              v-model="addressLine1"
              placeholder="Adres"
              :class="{'border-destructive': errors.addressLine1}"
            />
            <p v-if="errors.addressLine1" class="text-xs text-destructive font-medium">{{ errors.addressLine1 }}</p>
          </div>
          <div class="space-y-2">
            <Label for="addressLine2">Adres Satırı 2</Label>
            <Input
              id="addressLine2"
              v-model="addressLine2"
              placeholder="Apartman, daire vb."
            />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="city">Şehir *</Label>
              <Input id="city" v-model="city" placeholder="Şehir" :class="{'border-destructive': errors.city}" />
              <p v-if="errors.city" class="text-xs text-destructive font-medium">{{ errors.city }}</p>
            </div>
            <div class="space-y-2">
              <Label for="state">İlçe</Label>
              <Input id="state" v-model="state" placeholder="İlçe" :class="{'border-destructive': errors.state}" />
              <p v-if="errors.state" class="text-xs text-destructive font-medium">{{ errors.state }}</p>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="postalCode">Posta Kodu *</Label>
              <Input
                id="postalCode"
                v-model="postalCode"
                placeholder="Posta kodu"
                :class="{'border-destructive': errors.postalCode}"
              />
              <p v-if="errors.postalCode" class="text-xs text-destructive font-medium">{{ errors.postalCode }}</p>
            </div>
            <div class="space-y-2">
              <Label for="phone">Telefon</Label>
              <Input id="phone" v-model="phone" placeholder="Telefon" :class="{'border-destructive': errors.phone}" />
              <p v-if="errors.phone" class="text-xs text-destructive font-medium">{{ errors.phone }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              id="default-address"
              v-model="isDefault"
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
            <Button type="submit" :disabled="isAddingAddress || !meta.valid">
              <LucideLoader2
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
