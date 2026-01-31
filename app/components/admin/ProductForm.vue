<script setup lang="ts">
import {
  Loader2,
  Plus,
  Trash2,
  Settings2,
  GripVertical,
  ExternalLink,
} from "lucide-vue-next";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { createProductRequestSchema } from "~~/server/utils/validation";

import type {
  Category,
  Product,
  ProductVariant,
  AttributeTemplate,
  TaxRate,
  VariantAttributeDefinition,
  VariantAttributeOption,
} from "~~/server/db/schema";

// Attribute type options
const attributeTypes = [
  { label: "Renk", value: "color" },
  { label: "Beden", value: "size" },
  { label: "Seçenek", value: "select" },
  { label: "Metin", value: "text" },
] as const;

// Fetch attribute templates from API
const { data: templatesData, refresh: refreshTemplates } = await useFetch(
  "/api/attribute-templates",
  {
    query: { active: "true" },
  },
);

// Fetch tax rates from API
const { data: taxRatesData } = await useFetch("/api/tax-rates");
const taxRates = computed(
  () => (taxRatesData.value?.data || []) as unknown as TaxRate[],
);

const attributeTemplates = computed(() => {
  const templates: Record<
    string,
    {
      label: string;
      type: VariantAttributeDefinition["type"];
      options: VariantAttributeOption[];
    }
  > = {};

  if (templatesData.value?.data) {
    const data = templatesData.value.data as any[];
    data.forEach((template: any) => {
      templates[template.name] = {
        label: template.label,
        type: template.type as VariantAttributeDefinition["type"],
        options: (template.options || []) as VariantAttributeOption[],
      };
    });
  }

  return templates;
});

interface ProductFormVariant {
  id?: string;
  sku: string;
  barcode: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  attributes: Record<string, string>; // Dynamic attributes
  stockQuantity: number;
  lowStockThreshold: number;
  weight: number | null;
  weightUnit: string;
  image: string | null;
  isActive: boolean;
}

interface ProductFormData {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  status: string;
  categoryId: string;
  taxRateId: string;
  // Flexible variant attributes
  variantAttributes: Record<string, VariantAttributeDefinition>;
  // New fields
  basePrice: number;
  compareAtPrice: number | undefined;
  isFeatured: boolean;
  isNew: boolean;
  trackInventory: boolean;
  metaTitle: string;
  metaDescription: string;
  // Gallery
  images: { url: string; alt: string | null }[];
  // Variants
  variants: ProductFormVariant[];
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
const showAttributeManager = ref(false);
const editingAttribute = ref<string | null>(null);

// Form data
const formData = reactive<ProductFormData>({
  title: props.product?.title || "",
  slug: props.product?.slug || "",
  description: props.product?.description || "",
  shortDescription: (props.product as any)?.shortDescription || "",
  thumbnail: props.product?.thumbnail || "",
  status: props.product?.status || "draft",
  categoryId: props.product?.categoryId || "none",
  taxRateId: (props.product as any)?.taxRateId || "none",
  variantAttributes: (props.product as any)?.variantAttributes || {},
  basePrice: (props.product as any)?.basePrice || 0,
  compareAtPrice: (props.product as any)?.compareAtPrice || undefined,
  isFeatured: (props.product as any)?.isFeatured || false,
  isNew: (props.product as any)?.isNew || false,
  trackInventory: (props.product as any)?.trackInventory ?? true,
  metaTitle: (props.product as any)?.metaTitle || "",
  metaDescription: (props.product as any)?.metaDescription || "",
  images:
    (props.product as any)?.images?.map((img: any) => ({
      url: img.url,
      alt: img.alt || null,
    })) || [],
  variants:
    props.product?.variants?.map((v) => ({
      id: v.id,
      sku: v.sku || "",
      barcode: (v as any).barcode || "",
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      costPrice: (v as any).costPrice || null,
      attributes: (v as any).attributes || {},
      stockQuantity: v.stockQuantity,
      lowStockThreshold: (v as any).lowStockThreshold || 5,
      weight: v.weight,
      weightUnit: v.weightUnit || "g",
      image: v.image || null,
      isActive: (v as any).isActive ?? true,
    })) || [],
});

// Setup vee-validate form
const {
  handleSubmit: handleVeeSubmit,
  errors,
  setValues,
  defineField,
} = useForm({
  validationSchema: toTypedSchema(createProductRequestSchema),
  initialValues: formData as any,
});

// Define fields with component sync
const [title] = defineField("title");
const [slug] = defineField("slug");
const [basePrice] = defineField("basePrice");
const [status] = defineField("status");
const [description] = defineField("description");
const [shortDescription] = defineField("shortDescription");
const [categoryId] = defineField("categoryId");
const [taxRateId] = defineField("taxRateId");
const [thumbnail] = defineField("thumbnail");

const serverError = ref<string | null>(null);

// Computed: Get attribute names for variant table columns
const attributeNames = computed(() => Object.keys(formData.variantAttributes));

// Sync title to slug (existing logic updated)
watch(title, (newTitle) => {
  if (!props.product && newTitle) {
    setValues({
      slug: newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    });
  }
});

// ============================================================================
// Attribute Management
// ============================================================================
const newAttributeName = ref("");
const newAttributeType = ref<VariantAttributeDefinition["type"]>("select");
const newAttributeLabel = ref("");

function addAttributeFromTemplate(templateKey: string) {
  if (formData.variantAttributes[templateKey]) return;

  const template = attributeTemplates.value[templateKey];
  if (template) {
    formData.variantAttributes[templateKey] = {
      name: templateKey,
      label: template.label,
      type: template.type,
      options: [...template.options],
    };

    // Update existing variants with empty attribute value
    formData.variants.forEach((v) => {
      if (!v.attributes[templateKey]) {
        v.attributes[templateKey] = "";
      }
    });
  }
}

function addCustomAttribute() {
  const name = newAttributeName.value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (!name || formData.variantAttributes[name]) return;

  formData.variantAttributes[name] = {
    name,
    label: newAttributeLabel.value || newAttributeName.value,
    type: newAttributeType.value,
    options: [],
  };

  // Update existing variants with empty attribute value
  formData.variants.forEach((v) => {
    v.attributes[name] = "";
  });

  newAttributeName.value = "";
  newAttributeLabel.value = "";
  editingAttribute.value = name;
}

function removeAttribute(attrName: string) {
  delete formData.variantAttributes[attrName];
  // Remove from all variants
  formData.variants.forEach((v) => {
    delete v.attributes[attrName];
  });
}

// Attribute Option Management
const newOptionValue = ref("");
const newOptionLabel = ref("");
const newOptionColorCode = ref("#000000");

function addOptionToAttribute(attrName: string) {
  const attr = formData.variantAttributes[attrName];
  if (!attr || !newOptionValue.value) return;

  const option: VariantAttributeOption = {
    value: newOptionValue.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    label: newOptionLabel.value || newOptionValue.value,
  };

  if (attr.type === "color") {
    option.colorCode = newOptionColorCode.value;
  }

  attr.options.push(option);

  newOptionValue.value = "";
  newOptionLabel.value = "";
  newOptionColorCode.value = "#000000";
}

function removeOptionFromAttribute(attrName: string, optionValue: string) {
  const attr = formData.variantAttributes[attrName];
  if (!attr) return;

  attr.options = attr.options.filter((o) => o.value !== optionValue);
}

// ============================================================================
// Variant Management
// ============================================================================
function addVariant() {
  const newVariant: ProductFormVariant = {
    sku: "",
    barcode: "",
    price: formData.basePrice || 0,
    compareAtPrice: null,
    costPrice: null,
    attributes: {},
    stockQuantity: 0,
    lowStockThreshold: 5,
    weight: null,
    weightUnit: "g",
    image: null,
    isActive: true,
  };

  // Initialize attributes with empty values
  Object.keys(formData.variantAttributes).forEach((attrName) => {
    newVariant.attributes[attrName] = "";
  });

  formData.variants.push(newVariant);
}

function removeVariant(index: number) {
  formData.variants.splice(index, 1);
}

function generateVariantCombinations() {
  const attrs = Object.entries(formData.variantAttributes);
  if (attrs.length === 0) return;

  // Get all option values for each attribute
  const optionLists = attrs.map(([name, attr]) =>
    attr.options.map((opt) => ({
      attrName: name,
      value: opt.value,
      label: opt.label,
    })),
  );

  // Generate cartesian product
  function cartesian<T>(arrays: T[][]): T[][] {
    return arrays.reduce<T[][]>(
      (acc, arr) => acc.flatMap((x) => arr.map((y) => [...x, y])),
      [[]],
    );
  }

  const combinations = cartesian(optionLists);

  // Create variants for each combination
  formData.variants = combinations.map((combo) => {
    const attributes: Record<string, string> = {};
    combo.forEach((item: any) => {
      attributes[item.attrName] = item.value;
    });

    return {
      sku: "",
      barcode: "",
      price: formData.basePrice || 0,
      compareAtPrice: null,
      costPrice: null,
      attributes,
      stockQuantity: 0,
      lowStockThreshold: 5,
      weight: null,
      weightUnit: "g",
      image: null,
      isActive: true,
    };
  });
}

// Get display value for an attribute in a variant
function getAttributeDisplayValue(
  variant: ProductFormVariant,
  attrName: string,
): string {
  const value = variant.attributes[attrName];
  if (!value) return "-";

  const attr = formData.variantAttributes[attrName];
  if (!attr) return value;

  const option = attr.options.find((o) => o.value === value);
  return option?.label || value;
}

// ============================================================================
// Submit
// ============================================================================
const handleSubmit = handleVeeSubmit(async (values) => {
  isSubmitting.value = true;
  serverError.value = null;
  try {
    // Merge variants and images which might have been updated manually in formData
    const finalData = {
      ...values,
      variants: formData.variants,
      images: formData.images,
      variantAttributes: formData.variantAttributes,
    };
    emit("submit", finalData as any);
  } finally {
    isSubmitting.value = false;
  }
});

// Method to set server errors from parent
defineExpose({
  setServerError: (error: string) => {
    serverError.value = error;
  },
});

// Gallery Management
const newImageUrl = ref("");
function addGalleryImage() {
  if (!newImageUrl.value) return;
  formData.images.push({ url: newImageUrl.value, alt: "" });
  newImageUrl.value = "";
}

function removeGalleryImage(index: number) {
  formData.images.splice(index, 1);
}

const statusOptions = [
  { label: "Taslak", value: "draft" },
  { label: "Aktif", value: "active" },
  { label: "Pasif", value: "inactive" },
  { label: "Stokta Yok", value: "out_of_stock" },
  { label: "Ön Sipariş", value: "backordered" },
  { label: "Gizli", value: "hidden" },
];

const weightUnits = [
  { label: "Gram (g)", value: "g" },
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Pound (lb)", value: "lb" },
  { label: "Ons (oz)", value: "oz" },
];
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Server Error Display -->
    <Alert v-if="serverError" variant="destructive">
      <AlertTitle>Hata</AlertTitle>
      <AlertDescription>{{ serverError }}</AlertDescription>
    </Alert>

    <!-- Basic Info -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Temel Bilgiler</CardTitle>
        <Button
          v-if="formData.slug && product"
          type="button"
          variant="ghost"
          size="sm"
          as-child
        >
          <NuxtLink :to="`/shop/${formData.slug}`" target="_blank">
            <ExternalLink class="h-4 w-4 mr-2" />
            Mağazada Görüntüle
          </NuxtLink>
        </Button>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="title">Ürün Adı *</Label>
            <Input
              id="title"
              v-model="title"
              placeholder="Ürün adı"
              :class="{ 'border-destructive': errors.title }"
            />
            <p v-if="errors.title" class="text-xs text-destructive">
              {{ errors.title }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="slug">URL Slug</Label>
            <Input
              id="slug"
              v-model="slug"
              placeholder="urun-adi"
              :class="{ 'border-destructive': errors.slug }"
            />
            <p v-if="errors.slug" class="text-xs text-destructive">
              {{ errors.slug }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="shortDescription">Kısa Açıklama</Label>
          <Input
            id="shortDescription"
            v-model="shortDescription"
            placeholder="Ürünün kısa açıklaması"
            :class="{ 'border-destructive': errors.shortDescription }"
          />
          <p v-if="errors.shortDescription" class="text-xs text-destructive">
            {{ errors.shortDescription }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="description">Detaylı Açıklama</Label>
          <Textarea
            id="description"
            v-model="description"
            placeholder="Ürün açıklaması..."
            rows="4"
            :class="{ 'border-destructive': errors.description }"
          />
          <p v-if="errors.description" class="text-xs text-destructive">
            {{ errors.description }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="category">Kategori</Label>
            <Select v-model="categoryId">
              <SelectTrigger :class="{ 'border-destructive': errors.categoryId }">
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
            <p v-if="errors.categoryId" class="text-xs text-destructive">
              {{ errors.categoryId }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="status">Durum</Label>
            <Select v-model="status">
              <SelectTrigger :class="{ 'border-destructive': errors.status }">
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
            <p v-if="errors.status" class="text-xs text-destructive">
              {{ errors.status }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="taxRate">Vergi Oranı</Label>
          <Select v-model="taxRateId">
            <SelectTrigger :class="{ 'border-destructive': errors.taxRateId }">
              <SelectValue placeholder="Vergi oranı seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Vergi Yok</SelectItem>
              <SelectItem
                v-for="rate in taxRates"
                :key="rate.id"
                :value="rate.id"
              >
                {{ rate.title }} (%{{ rate.rate }})
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.taxRateId" class="text-xs text-destructive">
            {{ errors.taxRateId }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="thumbnail">Thumbnail URL</Label>
          <div class="flex gap-2">
            <Input
              id="thumbnail"
              v-model="thumbnail"
              placeholder="https://..."
              class="flex-1"
              :class="{ 'border-destructive': errors.thumbnail }"
            />
            <div
              v-if="thumbnail"
              class="w-10 h-10 rounded border overflow-hidden shrink-0"
            >
              <img :src="thumbnail" class="w-full h-full object-cover" />
            </div>
          </div>
          <p v-if="errors.thumbnail" class="text-xs text-destructive">
            {{ errors.thumbnail }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Product Gallery -->
    <Card>
      <CardHeader>
        <CardTitle>Ürün Galerisi</CardTitle>
        <CardDescription
          >Ürüne ait fotoğraflar. Bu fotoğraflar varyantlarda da
          kullanılabilir.</CardDescription
        >
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex gap-2">
          <Input v-model="newImageUrl" placeholder="Resim URL (https://...)" />
          <Button type="button" variant="outline" @click="addGalleryImage">
            <Plus class="h-4 w-4 mr-2" />
            Ekle
          </Button>
        </div>

        <div v-if="formData.images.length > 0" class="grid grid-cols-4 gap-4">
          <div
            v-for="(img, index) in formData.images"
            :key="index"
            class="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
          >
            <img :src="img.url" class="w-full h-full object-cover" />
            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Button
                type="button"
                variant="destructive"
                size="icon"
                class="h-8 w-8"
                @click="removeGalleryImage(index)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4 text-muted-foreground text-sm">
          Henüz galeriye resim eklenmedi.
        </div>
      </CardContent>
    </Card>

    <!-- Pricing -->
    <Card>
      <CardHeader>
        <CardTitle>Fiyatlandırma</CardTitle>
        <CardDescription
          >Temel fiyat bilgileri (varyantlarda
          değiştirilebilir)</CardDescription
        >
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="basePrice">Temel Fiyat</Label>
            <Input
              id="basePrice"
              v-model.number="basePrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :class="{ 'border-destructive': errors.basePrice }"
            />
            <p v-if="errors.basePrice" class="text-xs text-destructive">
              {{ errors.basePrice }}
            </p>
          </div>
          <div class="space-y-2">
            <Label for="compareAtPrice"
              >Karşılaştırma Fiyatı (İndirimli gösterim için)</Label
            >
            <Input
              id="compareAtPrice"
              v-model.number="formData.compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Flags -->
    <Card>
      <CardHeader>
        <CardTitle>Özellikler</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-wrap gap-6">
          <div class="flex items-center space-x-2">
            <Checkbox id="isFeatured" v-model:checked="formData.isFeatured" />
            <Label for="isFeatured" class="cursor-pointer"
              >Öne Çıkan Ürün</Label
            >
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox id="isNew" v-model:checked="formData.isNew" />
            <Label for="isNew" class="cursor-pointer">Yeni Ürün</Label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox
              id="trackInventory"
              v-model:checked="formData.trackInventory"
            />
            <Label for="trackInventory" class="cursor-pointer"
              >Stok Takibi</Label
            >
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Variant Attributes -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Varyant Özellikleri</CardTitle>
          <CardDescription>
            Ürün varyantları için kullanılacak özellikler (renk, beden, malzeme
            vb.)
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          @click="showAttributeManager = !showAttributeManager"
        >
          <Settings2 class="h-4 w-4 mr-2" />
          Özellikleri Yönet
        </Button>
      </CardHeader>
      <CardContent>
        <!-- Current Attributes Display -->
        <div v-if="attributeNames.length > 0" class="flex flex-wrap gap-2 mb-4">
          <Badge
            v-for="attrName in attributeNames"
            :key="attrName"
            variant="secondary"
            class="px-3 py-1"
          >
            {{ formData.variantAttributes[attrName]?.label }}
            <span class="text-muted-foreground ml-1">
              ({{ formData.variantAttributes[attrName]?.options?.length || 0 }}
              seçenek)
            </span>
          </Badge>
        </div>
        <div v-else class="text-center py-4 text-muted-foreground">
          Henüz varyant özelliği eklenmedi. Özellikleri Yönet butonuna
          tıklayarak ekleyin.
        </div>

        <!-- Attribute Manager Panel -->
        <div
          v-if="showAttributeManager"
          class="border rounded-lg p-4 mt-4 space-y-4"
        >
          <div class="text-sm font-medium">Hazır Şablonlar</div>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="(template, key) in attributeTemplates"
              :key="key"
              type="button"
              variant="outline"
              size="sm"
              :disabled="!!formData.variantAttributes[key]"
              @click="addAttributeFromTemplate(key)"
            >
              <Plus class="h-3 w-3 mr-1" />
              {{ template.label }}
            </Button>
          </div>

          <Separator />

          <div class="text-sm font-medium">Özel Özellik Ekle</div>
          <div class="grid gap-2 sm:grid-cols-4">
            <Input
              v-model="newAttributeName"
              placeholder="Özellik adı (ör: memory)"
            />
            <Input
              v-model="newAttributeLabel"
              placeholder="Görünen ad (ör: Bellek)"
            />
            <Select v-model="newAttributeType">
              <SelectTrigger>
                <SelectValue placeholder="Tür" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="type in attributeTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" @click="addCustomAttribute">
              <Plus class="h-4 w-4 mr-2" />
              Ekle
            </Button>
          </div>

          <Separator v-if="attributeNames.length > 0" />

          <!-- Edit Existing Attributes -->
          <div v-if="attributeNames.length > 0" class="space-y-4">
            <div class="text-sm font-medium">Mevcut Özellikler</div>
            <div
              v-for="attrName in attributeNames"
              :key="attrName"
              class="border rounded-lg p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">
                  {{ formData.variantAttributes[attrName]?.label }}
                  <span class="text-xs text-muted-foreground ml-1"
                    >({{ attrName }})</span
                  >
                </div>
                <div class="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    @click="
                      editingAttribute =
                        editingAttribute === attrName ? null : attrName
                    "
                  >
                    {{ editingAttribute === attrName ? "Kapat" : "Düzenle" }}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="text-destructive"
                    @click="removeAttribute(attrName)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <!-- Options Display -->
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="opt in formData.variantAttributes[attrName]?.options ||
                  []"
                  :key="opt.value"
                  variant="outline"
                  class="text-xs"
                >
                  <span
                    v-if="
                      formData.variantAttributes[attrName]?.type === 'color' &&
                      opt.colorCode
                    "
                    class="w-3 h-3 rounded-full mr-1 border"
                    :style="{ backgroundColor: opt.colorCode }"
                  />
                  {{ opt.label }}
                </Badge>
              </div>

              <!-- Edit Options Panel -->
              <div
                v-if="editingAttribute === attrName"
                class="mt-3 pt-3 border-t space-y-2"
              >
                <div class="grid gap-2 sm:grid-cols-4">
                  <Input
                    v-model="newOptionValue"
                    placeholder="Değer (ör: red)"
                  />
                  <Input
                    v-model="newOptionLabel"
                    placeholder="Etiket (ör: Kırmızı)"
                  />
                  <Input
                    v-if="
                      formData.variantAttributes[attrName]?.type === 'color'
                    "
                    v-model="newOptionColorCode"
                    type="color"
                    class="h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    @click="addOptionToAttribute(attrName)"
                  >
                    Seçenek Ekle
                  </Button>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <Badge
                    v-for="opt in formData.variantAttributes[attrName]
                      ?.options || []"
                    :key="opt.value"
                    variant="secondary"
                    class="cursor-pointer"
                    @click="removeOptionFromAttribute(attrName, opt.value)"
                  >
                    <span
                      v-if="
                        formData.variantAttributes[attrName]?.type ===
                          'color' && opt.colorCode
                      "
                      class="w-3 h-3 rounded-full mr-1 border"
                      :style="{ backgroundColor: opt.colorCode }"
                    />
                    {{ opt.label }}
                    <span class="ml-1 text-muted-foreground">&times;</span>
                  </Badge>
                </div>
              </div>
            </div>
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
        <div class="flex gap-2">
          <Button
            v-if="attributeNames.length > 0"
            type="button"
            variant="outline"
            size="sm"
            @click="generateVariantCombinations"
          >
            Kombinasyonları Oluştur
          </Button>
          <Button type="button" variant="outline" size="sm" @click="addVariant">
            <Plus class="h-4 w-4 mr-2" />
            Varyant Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          v-if="formData.variants.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          Henüz varyant eklenmedi
        </div>
        <div v-else class="space-y-4">
          <!-- Table Header -->
          <div
            class="hidden sm:grid gap-2 text-xs font-medium text-muted-foreground px-4"
            :style="{
              gridTemplateColumns: `repeat(${6 + attributeNames.length}, 1fr) auto`,
            }"
          >
            <div>Resim</div>
            <div>SKU</div>
            <div v-for="attrName in attributeNames" :key="attrName">
              {{ formData.variantAttributes[attrName]?.label }}
            </div>
            <div>Fiyat</div>
            <div>İndirimsiz Fiyat</div>
            <div>Stok</div>
            <div>Aktif</div>
            <div></div>
          </div>

          <!-- Variant Rows -->
          <div
            v-for="(variant, index) in formData.variants"
            :key="index"
            class="grid gap-2 p-4 border rounded-lg items-center"
            :style="{
              gridTemplateColumns: `repeat(${6 + attributeNames.length}, 1fr) auto`,
            }"
          >
            <div class="space-y-1">
              <Label class="sm:hidden text-xs">z</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <div
                    class="h-9 w-9 rounded-md border bg-muted cursor-pointer overflow-hidden flex items-center justify-center relative group"
                  >
                    <img
                      v-if="variant.image"
                      :src="variant.image"
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="text-[10px] text-muted-foreground uppercase"
                    >
                      Resim
                    </div>
                    <div
                      class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Settings2 class="h-3 w-3 text-white" />
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent class="w-80">
                  <div class="space-y-4">
                    <div class="text-sm font-medium">Varyant Resmi</div>
                    <div class="space-y-2">
                      <Label class="text-xs">URL Girin</Label>
                      <Input
                        :model-value="variant.image || ''"
                        @update:model-value="variant.image = ($event as string) || null"
                        placeholder="https://..."
                        class="h-8 text-xs"
                      />
                    </div>
                    <div v-if="formData.images.length > 0" class="space-y-2">
                      <Label class="text-xs">Galeriden Seç</Label>
                      <div class="grid grid-cols-5 gap-2">
                        <div
                          v-for="(img, imgIdx) in formData.images"
                          :key="imgIdx"
                          class="aspect-square rounded border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          :class="{
                            'ring-2 ring-primary': variant.image === img.url,
                          }"
                          @click="variant.image = img.url"
                        >
                          <img
                            :src="img.url"
                            class="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      v-if="variant.image"
                      type="button"
                      variant="outline"
                      size="sm"
                      class="w-full text-xs h-8"
                      @click="variant.image = null"
                    >
                      Resmi Kaldır
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-1">
              <Label class="sm:hidden text-xs">SKU</Label>
              <Input v-model="variant.sku" placeholder="SKU" class="h-9" />
            </div>
            <!-- Dynamic Attribute Fields -->
            <div
              v-for="attrName in attributeNames"
              :key="attrName"
              class="space-y-1"
            >
              <Label class="sm:hidden text-xs">{{
                formData.variantAttributes[attrName]?.label
              }}</Label>
              <Select v-model="variant.attributes[attrName]">
                <SelectTrigger class="h-9">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in formData.variantAttributes[attrName]
                      ?.options || []"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    <span class="flex items-center gap-2">
                      <span
                        v-if="
                          formData.variantAttributes[attrName]?.type ===
                            'color' && opt.colorCode
                        "
                        class="w-3 h-3 rounded-full border"
                        :style="{ backgroundColor: opt.colorCode }"
                      />
                      {{ opt.label }}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="sm:hidden text-xs">Fiyat</Label>
              <Input
                v-model.number="variant.price"
                type="number"
                step="0.01"
                min="0"
                class="h-9"
              />
            </div>
            <div class="space-y-1">
              <Label class="sm:hidden text-xs">İndirimsiz Fiyat</Label>
              <Input
                :model-value="variant.compareAtPrice ?? ''"
                @update:model-value="variant.compareAtPrice = $event !== '' ? Number($event) : null"
                type="number"
                step="0.01"
                min="0"
                class="h-9"
                placeholder="0.00"
              />
            </div>
            <div class="space-y-1">
              <Label class="sm:hidden text-xs">Stok</Label>
              <Input
                v-model.number="variant.stockQuantity"
                type="number"
                min="0"
                class="h-9"
              />
            </div>
            <div class="flex items-center justify-center">
              <Checkbox v-model:checked="variant.isActive" />
            </div>
            <div class="flex items-center justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-destructive h-9 w-9"
                @click="removeVariant(index)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- SEO -->
    <Card>
      <CardHeader>
        <CardTitle>SEO</CardTitle>
        <CardDescription>Arama motoru optimizasyonu ayarları</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="metaTitle">Meta Başlık</Label>
          <Input
            id="metaTitle"
            v-model="formData.metaTitle"
            placeholder="Sayfa başlığı (boş bırakılırsa ürün adı kullanılır)"
          />
        </div>
        <div class="space-y-2">
          <Label for="metaDescription">Meta Açıklama</Label>
          <Textarea
            id="metaDescription"
            v-model="formData.metaDescription"
            placeholder="Arama sonuçlarında görünecek açıklama"
            rows="2"
          />
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
