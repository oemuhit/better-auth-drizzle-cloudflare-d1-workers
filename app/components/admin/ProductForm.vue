<script setup lang="ts">
import { Loader2, Plus, Trash2 } from "lucide-vue-next";

import type { Category, Product, ProductVariant } from "~~/server/db/schema";
interface ProductFormData {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  status: string;
  categoryId: string;
  colors: string[];
  sizes: string[];
  variants: Array<{
    id?: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    color: string;
    size: string;
    stockQuantity: number;
  }>;
}

const props = defineProps<{
  product?: Product & { variants?: ProductVariant[] };
  categories: Category[];
}>();

const emit = defineEmits<{
  submit: [data: ProductFormData];
  cancel: [];
}>();

const isSubmitting = ref(false);

// Form data
const formData = reactive<ProductFormData>({
  title: props.product?.title || "",
  slug: props.product?.slug || "",
  description: props.product?.description || "",
  thumbnail: props.product?.thumbnail || "",
  status: props.product?.status || "active",
  categoryId: props.product?.categoryId || "none",
  colors: (props.product?.colors as string[]) || [],
  sizes: (props.product?.sizes as string[]) || [],
  variants:
    props.product?.variants?.map((v) => ({
      id: v.id,
      sku: v.sku || "",
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      color: v.color || "",
      size: v.size || "",
      stockQuantity: v.stockQuantity,
    })) || [],
});

// Auto-generate slug from title
watch(
  () => formData.title,
  (title) => {
    if (!props.product) {
      formData.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
  },
);

// Color/Size input
const newColor = ref("");
const newSize = ref("");

function addColor() {
  if (newColor.value && !formData.colors.includes(newColor.value)) {
    formData.colors.push(newColor.value);
    newColor.value = "";
  }
}

function removeColor(color: string) {
  formData.colors = formData.colors.filter((c) => c !== color);
}

function addSize() {
  if (newSize.value && !formData.sizes.includes(newSize.value)) {
    formData.sizes.push(newSize.value);
    newSize.value = "";
  }
}

function removeSize(size: string) {
  formData.sizes = formData.sizes.filter((s) => s !== size);
}

// Variants
function addVariant() {
  formData.variants.push({
    sku: "",
    price: 0,
    compareAtPrice: null,
    color: "",
    size: "",
    stockQuantity: 0,
  });
}

function removeVariant(index: number) {
  formData.variants.splice(index, 1);
}

// Submit
async function handleSubmit() {
  if (!formData.title) return;

  isSubmitting.value = true;
  try {
    emit("submit", { ...formData });
  } finally {
    isSubmitting.value = false;
  }
}

const statusOptions = [
  { label: "Aktif", value: "active" },
  { label: "Pasif", value: "inactive" },
  { label: "Stokta Yok", value: "out_of_stock" },
  { label: "Gizli", value: "hidden" },
];
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Basic Info -->
    <Card>
      <CardHeader>
        <CardTitle>Temel Bilgiler</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="title">Ürün Adı *</Label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="Ürün adı"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="slug">URL Slug</Label>
            <Input id="slug" v-model="formData.slug" placeholder="urun-adi" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="description">Açıklama</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            placeholder="Ürün açıklaması..."
            rows="4"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="category">Kategori</Label>
            <Select v-model="formData.categoryId">
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kategori Yok</SelectItem>
                <SelectItem
                  v-for="cat in categories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.title }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="status">Durum</Label>
            <Select v-model="formData.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="thumbnail">Thumbnail URL</Label>
          <Input
            id="thumbnail"
            v-model="formData.thumbnail"
            placeholder="https://..."
          />
        </div>
      </CardContent>
    </Card>

    <!-- Colors & Sizes -->
    <Card>
      <CardHeader>
        <CardTitle>Renkler & Bedenler</CardTitle>
        <CardDescription>
          Ürün varyantları için kullanılacak renk ve beden seçenekleri
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Colors -->
        <div class="space-y-2">
          <Label>Renkler</Label>
          <div class="flex gap-2">
            <Input
              v-model="newColor"
              placeholder="Renk ekle"
              @keyup.enter.prevent="addColor"
            />
            <Button type="button" variant="outline" @click="addColor">
              <Plus class="h-4 w-4" />
            </Button>
          </div>
          <div class="flex flex-wrap gap-2 mt-2">
            <Badge
              v-for="color in formData.colors"
              :key="color"
              variant="secondary"
              class="cursor-pointer"
              @click="removeColor(color)"
            >
              {{ color }}
              <span class="ml-1">&times;</span>
            </Badge>
          </div>
        </div>

        <!-- Sizes -->
        <div class="space-y-2">
          <Label>Bedenler</Label>
          <div class="flex gap-2">
            <Input
              v-model="newSize"
              placeholder="Beden ekle"
              @keyup.enter.prevent="addSize"
            />
            <Button type="button" variant="outline" @click="addSize">
              <Plus class="h-4 w-4" />
            </Button>
          </div>
          <div class="flex flex-wrap gap-2 mt-2">
            <Badge
              v-for="size in formData.sizes"
              :key="size"
              variant="secondary"
              class="cursor-pointer"
              @click="removeSize(size)"
            >
              {{ size }}
              <span class="ml-1">&times;</span>
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Variants -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Varyantlar</CardTitle>
          <CardDescription>Ürün varyantları ve fiyatları</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" @click="addVariant">
          <Plus class="h-4 w-4 mr-2" />
          Varyant Ekle
        </Button>
      </CardHeader>
      <CardContent>
        <div
          v-if="formData.variants.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          Henüz varyant eklenmedi
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="(variant, index) in formData.variants"
            :key="index"
            class="grid gap-4 sm:grid-cols-6 p-4 border rounded-lg"
          >
            <div class="space-y-2">
              <Label>SKU</Label>
              <Input v-model="variant.sku" placeholder="SKU" />
            </div>
            <div class="space-y-2">
              <Label>Fiyat *</Label>
              <Input
                v-model.number="variant.price"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div class="space-y-2">
              <Label>Renk</Label>
              <Input v-model="variant.color" placeholder="Renk" />
            </div>
            <div class="space-y-2">
              <Label>Beden</Label>
              <Input v-model="variant.size" placeholder="Beden" />
            </div>
            <div class="space-y-2">
              <Label>Stok</Label>
              <Input
                v-model.number="variant.stockQuantity"
                type="number"
                min="0"
              />
            </div>
            <div class="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-destructive"
                @click="removeVariant(index)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Actions -->
    <div class="flex justify-end gap-4">
      <Button type="button" variant="outline" @click="emit('cancel')">
        İptal
      </Button>
      <Button type="submit" :disabled="isSubmitting || !formData.title">
        <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
        {{ product ? "Güncelle" : "Oluştur" }}
      </Button>
    </div>
  </form>
</template>
