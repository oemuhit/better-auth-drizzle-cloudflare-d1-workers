<script setup lang="ts">
import {
  Loader2,
  Plus,
  Trash2,
  Settings2,
  GripVertical,
  ExternalLink,
} from "lucide-vue-next";

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
  isActive: boolean;
  // Legacy fields for backwards compatibility
  color?: string;
  size?: string;
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
  // Legacy fields (kept for backwards compatibility)
  colors: string[];
  sizes: string[];
  // New fields
  basePrice: number;
  compareAtPrice: number | undefined;
  isFeatured: boolean;
  isNew: boolean;
  trackInventory: boolean;
  metaTitle: string;
  metaDescription: string;
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
  colors: (props.product?.colors as string[]) || [],
  sizes: (props.product?.sizes as string[]) || [],
  basePrice: (props.product as any)?.basePrice || 0,
  compareAtPrice: (props.product as any)?.compareAtPrice || undefined,
  isFeatured: (props.product as any)?.isFeatured || false,
  isNew: (props.product as any)?.isNew || false,
  trackInventory: (props.product as any)?.trackInventory ?? true,
  metaTitle: (props.product as any)?.metaTitle || "",
  metaDescription: (props.product as any)?.metaDescription || "",
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
      isActive: (v as any).isActive ?? true,
      color: v.color || "",
      size: v.size || "",
    })) || [],
});

// Computed: Get attribute names for variant table columns
const attributeNames = computed(() => Object.keys(formData.variantAttributes));

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
    isActive: true,
    color: "",
    size: "",
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
      isActive: true,
      // Legacy fields
      color: attributes.color || "",
      size: attributes.size || "",
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
async function handleSubmit() {
  if (!formData.title) return;

  isSubmitting.value = true;
  try {
    // Sync legacy fields from attributes for backwards compatibility
    formData.variants.forEach((v) => {
      if (v.attributes.color) v.color = v.attributes.color;
      if (v.attributes.size) v.size = v.attributes.size;
    });

    // Extract unique colors and sizes from variants for legacy fields
    const uniqueColors = new Set<string>();
    const uniqueSizes = new Set<string>();
    formData.variants.forEach((v) => {
      if (v.attributes.color) uniqueColors.add(v.attributes.color);
      if (v.attributes.size) uniqueSizes.add(v.attributes.size);
    });
    formData.colors = Array.from(uniqueColors);
    formData.sizes = Array.from(uniqueSizes);

    emit("submit", { ...formData });
  } finally {
    isSubmitting.value = false;
  }
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
          <Label for="shortDescription">Kısa Açıklama</Label>
          <Input
            id="shortDescription"
            v-model="formData.shortDescription"
            placeholder="Ürünün kısa açıklaması"
          />
        </div>

        <div class="space-y-2">
          <Label for="description">Detaylı Açıklama</Label>
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
          <Label for="taxRate">Vergi Oranı</Label>
          <Select v-model="formData.taxRateId">
            <SelectTrigger>
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
              v-model.number="formData.basePrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
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
              gridTemplateColumns: `repeat(${4 + attributeNames.length}, 1fr) auto`,
            }"
          >
            <div>SKU</div>
            <div>Fiyat</div>
            <div v-for="attrName in attributeNames" :key="attrName">
              {{ formData.variantAttributes[attrName]?.label }}
            </div>
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
              gridTemplateColumns: `repeat(${4 + attributeNames.length}, 1fr) auto`,
            }"
          >
            <div class="space-y-1">
              <Label class="sm:hidden text-xs">SKU</Label>
              <Input v-model="variant.sku" placeholder="SKU" class="h-9" />
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
