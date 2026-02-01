<script setup lang="ts">
import { 
  Plus, 
  MapPin, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Check, 
  Loader2,
  AlertCircle,
  Home,
  Building2,
  Phone
} from "lucide-vue-next";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

definePageMeta({
  layout: "account",
  middleware: "auth",
});

const { data: profileData, refresh } = await useFetch("/api/user/profile");
const addresses = computed(() => profileData.value?.data.addresses || []);

const isAdding = ref(false);
const editingAddress = ref<any>(null);
const isSubmitting = ref(false);
const error = ref<string | null>(null);

const confirmDeleteId = ref<string | null>(null);
const isDeleteDialogOpen = ref(false);

function openDeleteDialog(id: string) {
  confirmDeleteId.value = id;
  isDeleteDialogOpen.value = true;
}

const addressSchema = toTypedSchema(z.object({
  firstName: z.string().min(1, "İsim gerekli"),
  lastName: z.string().min(1, "Soyisim gerekli"),
  addressLine1: z.string().min(5, "Adres çok kısa"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Şehir gerekli"),
  state: z.string().min(2, "İlçe/Eyalet gerekli"),
  postalCode: z.string().min(5, "Posta kodu en az 5 haneli olmalıdır"),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin (örn: 05xx)"),
  isShipping: z.boolean().default(true),
  isBilling: z.boolean().default(true),
  isDefault: z.boolean().default(false),
}));

const { handleSubmit, resetForm, setValues, errors, defineField } = useForm({
  validationSchema: addressSchema,
  initialValues: {
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    isShipping: true,
    isBilling: true,
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
const [isShipping] = defineField('isShipping');
const [isBilling] = defineField('isBilling');
const [isDefault] = defineField('isDefault');

function handleCancel() {
  resetForm();
  isAdding.value = false;
  editingAddress.value = null;
  error.value = null;
}

function startEdit(address: any) {
  editingAddress.value = address;
  setValues({ ...address });
  isAdding.value = true;
}

const onSave = handleSubmit(async (formValues) => {
  isSubmitting.value = true;
  error.value = null;

  try {
    if (editingAddress.value) {
      await $fetch(`/api/user/addresses/${editingAddress.value.id}`, {
        method: "PATCH",
        body: formValues,
      });
    } else {
      await $fetch("/api/user/addresses", {
        method: "POST",
        body: formValues,
      });
    }
    await refresh();
    handleCancel();
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Adres kaydedilemedi";
  } finally {
    isSubmitting.value = false;
  }
});

async function deleteAddress() {
  if (!confirmDeleteId.value) return;

  try {
    await $fetch(`/api/user/addresses/${confirmDeleteId.value}`, {
      method: "DELETE",
    });
    await refresh();
  } catch (err: any) {
    alert("Adres silinemedi");
  } finally {
    isDeleteDialogOpen.value = false;
    confirmDeleteId.value = null;
  }
}

async function setAsDefault(address: any) {
  try {
    await $fetch(`/api/user/addresses/${address.id}`, {
      method: "PATCH",
      body: { ...address, isDefault: true },
    });
    await refresh();
  } catch (err: any) {
    alert("Varsayılan adres güncellenemedi");
  }
}

useHead({
  title: "Adreslerim | Hesabım",
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold font-heading">Adreslerim</h1>
        <p class="text-muted-foreground mt-1">Siparişleriniz için teslimat ve fatura adreslerini yönetin</p>
      </div>
      <Button v-if="!isAdding" @click="isAdding = true" class="rounded-full px-6">
        <Plus class="h-4 w-4 mr-2" />
        Yeni Adres Ekle
      </Button>
    </div>

    <!-- Address Form (Add/Edit) -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
    >
      <Card v-if="isAdding" class="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle class="text-xl flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus v-if="!editingAddress" class="h-4 w-4 text-primary" />
              <Edit2 v-else class="h-4 w-4 text-primary" />
            </div>
            {{ editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle' }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit="onSave" class="space-y-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <Label for="firstName">Ad</Label>
                <Input id="firstName" v-model="firstName" placeholder="Örn: Ahmet" :class="{'border-destructive': errors.firstName}" />
                <p v-if="errors.firstName" class="text-xs text-destructive font-medium">{{ errors.firstName }}</p>
              </div>
              <div class="space-y-2">
                <Label for="lastName">Soyad</Label>
                <Input id="lastName" v-model="lastName" placeholder="Örn: Yılmaz" :class="{'border-destructive': errors.lastName}" />
                <p v-if="errors.lastName" class="text-xs text-destructive font-medium">{{ errors.lastName }}</p>
              </div>
              <div class="sm:col-span-2 space-y-2">
                <Label for="addressLine1">Adres</Label>
                <Input id="addressLine1" v-model="addressLine1" placeholder="Sokak, mahalle, no..." :class="{'border-destructive': errors.addressLine1}" />
                <p v-if="errors.addressLine1" class="text-xs text-destructive font-medium">{{ errors.addressLine1 }}</p>
              </div>
              <div class="sm:col-span-2 space-y-2">
                <Label for="addressLine2">Apartman, Kat, Daire (Opsiyonel)</Label>
                <Input id="addressLine2" v-model="addressLine2" placeholder="Örn: Güneş Apt. No:5 Daire:2" />
              </div>
              <div class="space-y-2">
                <Label for="city">Şehir</Label>
                <Input id="city" v-model="city" placeholder="Örn: İstanbul" :class="{'border-destructive': errors.city}" />
                <p v-if="errors.city" class="text-xs text-destructive font-medium">{{ errors.city }}</p>
              </div>
              <div class="space-y-2">
                <Label for="state">İlçe</Label>
                <Input id="state" v-model="state" placeholder="Örn: Kadıköy" :class="{'border-destructive': errors.state}" />
                <p v-if="errors.state" class="text-xs text-destructive font-medium">{{ errors.state }}</p>
              </div>
              <div class="space-y-2">
                <Label for="postalCode">Posta Kodu</Label>
                <Input id="postalCode" v-model="postalCode" placeholder="34000" :class="{'border-destructive': errors.postalCode}" />
                <p v-if="errors.postalCode" class="text-xs text-destructive font-medium">{{ errors.postalCode }}</p>
              </div>
              <div class="space-y-2">
                <Label for="phone">Telefon</Label>
                <div class="relative">
                  <Phone class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" v-model="phone" placeholder="05XX XXX XX XX" class="pl-10" :class="{'border-destructive': errors.phone}" />
                </div>
                <p v-if="errors.phone" class="text-xs text-destructive font-medium">{{ errors.phone }}</p>
              </div>
              
              <div class="sm:col-span-2 flex flex-wrap items-center gap-6 pt-2">
                <div class="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                  <Checkbox id="isShipping" :checked="isShipping" @update:checked="v => isShipping = v" />
                  <Label for="isShipping" class="text-sm font-semibold cursor-pointer select-none">Teslimat Adresi</Label>
                </div>
                <div class="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                  <Checkbox id="isBilling" :checked="isBilling" @update:checked="v => isBilling = v" />
                  <Label for="isBilling" class="text-sm font-semibold cursor-pointer select-none">Fatura Adresi</Label>
                </div>
                <div class="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                  <Checkbox id="isDefault" :checked="isDefault" @update:checked="v => isDefault = v" />
                  <Label for="isDefault" class="text-sm font-semibold cursor-pointer select-none">Varsayılan Adres Yap</Label>
                </div>
              </div>
            </div>

            <div v-if="error" class="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 border border-destructive/20 animate-pulse">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <p class="text-sm font-medium">{{ error }}</p>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" @click="handleCancel" :disabled="isSubmitting" class="rounded-full">İptal</Button>
              <Button type="submit" :disabled="isSubmitting" class="rounded-full px-8">
                <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
                {{ editingAddress ? 'Güncelle' : 'Kaydet' }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Transition>

    <!-- Address List (List View) -->
    <div v-if="!isAdding" class="space-y-4">
      <Card v-if="addresses.length > 0" class="overflow-hidden border-none shadow-none bg-transparent">
        <div class="space-y-3">
          <div 
            v-for="address in addresses" 
            :key="address.id" 
            class="bg-background border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group relative"
          >
            <div class="flex flex-col md:flex-row md:items-center gap-4">
              <!-- Icon/Status -->
              <div class="flex-shrink-0 flex items-center gap-3">
                <div 
                  class="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors"
                  :class="address.isDefault ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted border-transparent text-muted-foreground'"
                >
                  <Home v-if="address.isShipping" class="h-5 w-5" />
                  <Building2 v-else class="h-5 w-5" />
                </div>
                <div class="md:hidden flex-1">
                  <p class="font-bold text-lg leading-none">{{ address.firstName }} {{ address.lastName }}</p>
                  <div class="flex gap-1.5 mt-2">
                    <Badge v-if="address.isDefault" variant="secondary" class="h-5 text-[10px] px-2 font-bold uppercase">Varsayılan</Badge>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 space-y-1">
                <div class="hidden md:flex items-center gap-3 mb-1">
                  <p class="font-bold text-lg leading-none">{{ address.firstName }} {{ address.lastName }}</p>
                  <Badge v-if="address.isDefault" variant="secondary" class="h-5 text-[10px] px-2 font-bold uppercase">Varsayılan</Badge>
                </div>
                <p class="text-sm text-foreground/80 leading-relaxed max-w-2xl">
                  {{ address.addressLine1 }}, {{ address.addressLine2 ? address.addressLine2 + ', ' : '' }}
                  {{ address.state }}, {{ address.postalCode }} {{ address.city }}
                </p>
                <div class="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1.5"><Phone class="h-3.5 w-3.5" /> {{ address.phone }}</span>
                  <div class="flex gap-2">
                    <span v-if="address.isShipping" class="px-2 py-0.5 bg-muted rounded text-[10px] font-bold uppercase">Teslimat</span>
                    <span v-if="address.isBilling" class="px-2 py-0.5 bg-muted rounded text-[10px] font-bold uppercase">Fatura</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 justify-end pt-4 md:pt-0">
                <Button variant="ghost" size="icon" @click="startEdit(address)" class="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <Edit2 class="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="rounded-full">
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuItem v-if="!address.isDefault" @click="setAsDefault(address)">
                      <Check class="h-4 w-4 mr-2" /> Varsayılan Yap
                    </DropdownMenuItem>
                    <DropdownMenuSeparator v-if="!address.isDefault" />
                    <DropdownMenuItem class="text-destructive focus:bg-destructive/10 focus:text-destructive" @click="openDeleteDialog(address.id)">
                      <Trash2 class="h-4 w-4 mr-2" /> Adresi Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Empty State -->
      <div v-else class="py-20 flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed rounded-3xl border-muted bg-muted/20">
        <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <MapPin class="h-10 w-10 text-muted-foreground/50" />
        </div>
        <div class="space-y-2">
          <p class="text-xl font-bold">Adres listeniz henüz boş</p>
          <p class="text-muted-foreground max-w-sm mx-auto">Alışverişlerinizi daha hızlı tamamlamak için teslimat ve fatura adreslerinizi şimdi ekleyin.</p>
        </div>
        <Button size="lg" @click="isAdding = true" class="rounded-full px-8 gap-2 shadow-lg shadow-primary/20">
          <Plus class="h-5 w-5" />
          İlk Adresini Ekle
        </Button>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Adresi silmek istediğinize emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. Bu adresi kalıcı olarak silecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">İptal</AlertDialogCancel>
          <AlertDialogAction @click="deleteAddress" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
.font-heading {
  letter-spacing: -0.02em;
}
</style>
