<script setup lang="ts">
import { Plus, Pencil, Trash2, Check } from "lucide-vue-next";
import type { TaxRate } from "~~/server/db/schema";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

useHead({
  title: "Vergi Oranları | Admin",
});

// Fetch tax rates
const { data: taxRatesData, refresh } = await useFetch("/api/tax-rates");
const taxRates = computed(() => (taxRatesData.value?.data || []) as TaxRate[]);

// Dialog state
const showDialog = ref(false);
const editingTaxRate = ref<TaxRate | null>(null);
const isSubmitting = ref(false);

const confirmDeleteData = ref<TaxRate | null>(null);
const isDeleteDialogOpen = ref(false);

function openDeleteDialog(taxRate: TaxRate) {
  confirmDeleteData.value = taxRate;
  isDeleteDialogOpen.value = true;
}

// Form state
const formData = reactive({
  title: "",
  code: "",
  rate: 0,
  isDefault: false,
  isActive: true,
});

function openCreateDialog() {
  editingTaxRate.value = null;
  formData.title = "";
  formData.code = "";
  formData.rate = 0;
  formData.isDefault = false;
  formData.isActive = true;
  showDialog.value = true;
}

function openEditDialog(taxRate: TaxRate) {
  editingTaxRate.value = taxRate;
  formData.title = taxRate.title;
  formData.code = taxRate.code;
  formData.rate = taxRate.rate;
  formData.isDefault = taxRate.isDefault;
  formData.isActive = taxRate.isActive;
  showDialog.value = true;
}

async function handleSubmit() {
  if (!formData.title || !formData.code) return;

  isSubmitting.value = true;
  try {
    if (editingTaxRate.value) {
      // Update
      await $fetch(`/api/tax-rates/${editingTaxRate.value.id}`, {
        method: "PUT",
        body: formData,
      });
    } else {
      // Create
      await $fetch("/api/tax-rates", {
        method: "POST",
        body: formData,
      });
    }

    showDialog.value = false;
    await refresh();
  } catch (error: any) {
    alert(error.data?.statusMessage || "İşlem başarısız");
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete() {
  if (!confirmDeleteData.value) return;

  try {
    await $fetch(`/api/tax-rates/${confirmDeleteData.value.id}`, {
      method: "DELETE",
    });
    await refresh();
  } catch (error: any) {
    alert(error.data?.statusMessage || "Silme işlemi başarısız");
  } finally {
    isDeleteDialogOpen.value = false;
    confirmDeleteData.value = null;
  }
}

async function setDefault(taxRate: TaxRate) {
  try {
    await $fetch(`/api/tax-rates/${taxRate.id}`, {
      method: "PUT",
      body: { isDefault: true },
    });
    await refresh();
  } catch (error: any) {
    alert(error.data?.statusMessage || "Güncelleme başarısız");
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Vergi Oranları</h1>
        <p class="text-muted-foreground">
          Ürünlere uygulanacak vergi oranlarını yönetin
        </p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="h-4 w-4 mr-2" />
        Yeni Vergi Oranı
      </Button>
    </div>

    <!-- Tax Rates Table -->
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Kod</TableHead>
            <TableHead>Oran</TableHead>
            <TableHead>Varsayılan</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead class="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="taxRate in taxRates" :key="taxRate.id">
            <TableCell class="font-medium">{{ taxRate.title }}</TableCell>
            <TableCell>
              <Badge variant="outline" class="font-mono">{{
                taxRate.code
              }}</Badge>
            </TableCell>
            <TableCell>%{{ taxRate.rate }}</TableCell>
            <TableCell>
              <Badge v-if="taxRate.isDefault" variant="default">
                <Check class="h-3 w-3 mr-1" />
                Varsayılan
              </Badge>
              <Button
                v-else
                variant="ghost"
                size="sm"
                @click="setDefault(taxRate)"
              >
                Varsayılan Yap
              </Button>
            </TableCell>
            <TableCell>
              <Badge :variant="taxRate.isActive ? 'default' : 'secondary'">
                {{ taxRate.isActive ? "Aktif" : "Pasif" }}
              </Badge>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  @click="openEditDialog(taxRate)"
                >
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-destructive"
                  @click="openDeleteDialog(taxRate)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="taxRates.length === 0">
            <TableCell
              colspan="6"
              class="text-center py-8 text-muted-foreground"
            >
              Henüz vergi oranı tanımlanmadı
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ editingTaxRate ? "Vergi Oranını Düzenle" : "Yeni Vergi Oranı" }}
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="title">Ad *</Label>
              <Input
                id="title"
                v-model="formData.title"
                placeholder="KDV %18"
                required
              />
            </div>
            <div class="space-y-2">
              <Label for="code">Kod *</Label>
              <Input
                id="code"
                v-model="formData.code"
                placeholder="KDV18"
                class="font-mono"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="rate">Oran (%)</Label>
            <Input
              id="rate"
              v-model.number="formData.rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
            />
          </div>

          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <Checkbox id="isDefault" v-model:checked="formData.isDefault" />
              <Label for="isDefault" class="cursor-pointer">Varsayılan</Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox id="isActive" v-model:checked="formData.isActive" />
              <Label for="isActive" class="cursor-pointer">Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="showDialog = false">
              İptal
            </Button>
            <Button
              type="submit"
              :disabled="isSubmitting || !formData.title || !formData.code"
            >
              {{ editingTaxRate ? "Güncelle" : "Oluştur" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vergi oranını silmek istediğinize emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. "{{ confirmDeleteData?.title }}" vergi oranı kalıcı olarak silinecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">İptal</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
