<script setup lang="ts">
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Palette,
  Ruler,
  ListFilter,
  Type,
} from "lucide-vue-next";
import type {
  AttributeTemplate,
  VariantAttributeOption,
} from "~~/server/db/schema";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

useHead({
  title: "Özellik Şablonları | Admin",
});

// Fetch templates
const { data: templatesData, refresh } = await useFetch(
  "/api/attribute-templates",
);
const templates = computed(
  () => (templatesData.value?.data || []) as AttributeTemplate[],
);

// Dialog state
const showDialog = ref(false);
const editingTemplate = ref<AttributeTemplate | null>(null);
const isSubmitting = ref(false);

// Form state
const formData = reactive({
  name: "",
  label: "",
  type: "select" as "color" | "size" | "select" | "text",
  description: "",
  icon: "",
  options: [] as VariantAttributeOption[],
  isActive: true,
});

// Option form state
const newOptionValue = ref("");
const newOptionLabel = ref("");
const newOptionColorCode = ref("#000000");

const typeOptions = [
  { value: "color", label: "Renk", icon: Palette },
  { value: "size", label: "Beden", icon: Ruler },
  { value: "select", label: "Seçenek Listesi", icon: ListFilter },
  { value: "text", label: "Metin", icon: Type },
];

function getTypeIcon(type: string) {
  const option = typeOptions.find((t) => t.value === type);
  return option?.icon || ListFilter;
}

function getTypeLabel(type: string) {
  const option = typeOptions.find((t) => t.value === type);
  return option?.label || type;
}

function openCreateDialog() {
  editingTemplate.value = null;
  formData.name = "";
  formData.label = "";
  formData.type = "select";
  formData.description = "";
  formData.icon = "";
  formData.options = [];
  formData.isActive = true;
  showDialog.value = true;
}

function openEditDialog(template: AttributeTemplate) {
  editingTemplate.value = template;
  formData.name = template.name;
  formData.label = template.label;
  formData.type = template.type as typeof formData.type;
  formData.description = template.description || "";
  formData.icon = template.icon || "";
  formData.options = [...(template.options || [])];
  formData.isActive = template.isActive;
  showDialog.value = true;
}

function addOption() {
  if (!newOptionValue.value) return;

  const option: VariantAttributeOption = {
    value: newOptionValue.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    label: newOptionLabel.value || newOptionValue.value,
  };

  if (formData.type === "color") {
    option.colorCode = newOptionColorCode.value;
  }

  formData.options.push(option);
  newOptionValue.value = "";
  newOptionLabel.value = "";
  newOptionColorCode.value = "#000000";
}

function removeOption(index: number) {
  formData.options.splice(index, 1);
}

async function handleSubmit() {
  if (!formData.label) return;

  isSubmitting.value = true;
  try {
    if (editingTemplate.value) {
      // Update
      await $fetch(`/api/attribute-templates/${editingTemplate.value.id}`, {
        method: "PUT",
        body: {
          label: formData.label,
          type: formData.type,
          description: formData.description || null,
          icon: formData.icon || null,
          options: formData.options,
          isActive: formData.isActive,
        },
      });
    } else {
      // Create
      await $fetch("/api/attribute-templates", {
        method: "POST",
        body: {
          name: formData.name,
          label: formData.label,
          type: formData.type,
          description: formData.description || null,
          icon: formData.icon || null,
          options: formData.options,
          isActive: formData.isActive,
        },
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

async function handleDelete(template: AttributeTemplate) {
  if (
    !confirm(`"${template.label}" şablonunu silmek istediğinize emin misiniz?`)
  ) {
    return;
  }

  try {
    await $fetch(`/api/attribute-templates/${template.id}`, {
      method: "DELETE",
    });
    await refresh();
  } catch (error: any) {
    alert(error.data?.statusMessage || "Silme işlemi başarısız");
  }
}

async function toggleActive(template: AttributeTemplate) {
  try {
    await $fetch(`/api/attribute-templates/${template.id}`, {
      method: "PUT",
      body: {
        isActive: !template.isActive,
      },
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
        <h1 class="text-2xl font-bold">Özellik Şablonları</h1>
        <p class="text-muted-foreground">
          Ürün varyantları için kullanılabilecek özellik şablonlarını yönetin
        </p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="h-4 w-4 mr-2" />
        Yeni Şablon
      </Button>
    </div>

    <!-- Templates Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="template in templates"
        :key="template.id"
        class="relative"
        :class="{ 'opacity-60': !template.isActive }"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
              >
                <component
                  :is="getTypeIcon(template.type)"
                  class="h-5 w-5 text-primary"
                />
              </div>
              <div>
                <CardTitle class="text-base">{{ template.label }}</CardTitle>
                <p class="text-xs text-muted-foreground font-mono">
                  {{ template.name }}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <span class="sr-only">Menü</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEditDialog(template)">
                  <Pencil class="h-4 w-4 mr-2" />
                  Düzenle
                </DropdownMenuItem>
                <DropdownMenuItem @click="toggleActive(template)">
                  {{ template.isActive ? "Pasifleştir" : "Aktifleştir" }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="text-destructive"
                  @click="handleDelete(template)"
                >
                  <Trash2 class="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{{ getTypeLabel(template.type) }}</Badge>
              <Badge v-if="!template.isActive" variant="secondary">Pasif</Badge>
            </div>
            <p
              v-if="template.description"
              class="text-sm text-muted-foreground line-clamp-2"
            >
              {{ template.description }}
            </p>
            <!-- Options Preview -->
            <div class="flex flex-wrap gap-1.5">
              <template
                v-for="(option, index) in (template.options || []).slice(0, 6)"
                :key="option.value"
              >
                <Badge variant="secondary" class="text-xs">
                  <span
                    v-if="template.type === 'color' && option.colorCode"
                    class="w-3 h-3 rounded-full mr-1.5 border"
                    :style="{ backgroundColor: option.colorCode }"
                  />
                  {{ option.label }}
                </Badge>
              </template>
              <Badge
                v-if="(template.options || []).length > 6"
                variant="outline"
                class="text-xs"
              >
                +{{ (template.options || []).length - 6 }} daha
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div
      v-if="templates.length === 0"
      class="text-center py-12 border rounded-lg border-dashed"
    >
      <p class="text-muted-foreground mb-4">Henüz şablon oluşturulmadı</p>
      <Button @click="openCreateDialog">
        <Plus class="h-4 w-4 mr-2" />
        İlk Şablonu Oluştur
      </Button>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {{ editingTemplate ? "Şablonu Düzenle" : "Yeni Şablon Oluştur" }}
          </DialogTitle>
          <DialogDescription>
            Ürün varyantları için kullanılacak özellik şablonunu yapılandırın.
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Basic Info -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="name">Teknik Ad *</Label>
              <Input
                id="name"
                v-model="formData.name"
                placeholder="color, size, material..."
                :disabled="!!editingTemplate"
                class="font-mono"
              />
              <p class="text-xs text-muted-foreground">
                Küçük harf, sayı ve alt çizgi kullanın
              </p>
            </div>
            <div class="space-y-2">
              <Label for="label">Görünen Ad *</Label>
              <Input
                id="label"
                v-model="formData.label"
                placeholder="Renk, Beden, Malzeme..."
                required
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="type">Tür</Label>
              <Select v-model="formData.type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="type in typeOptions"
                    :key="type.value"
                    :value="type.value"
                  >
                    <span class="flex items-center gap-2">
                      <component :is="type.icon" class="h-4 w-4" />
                      {{ type.label }}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="icon">İkon (Lucide)</Label>
              <Input
                id="icon"
                v-model="formData.icon"
                placeholder="palette, ruler, shirt..."
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="description">Açıklama</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              placeholder="Bu şablon hakkında kısa bir açıklama..."
              rows="2"
            />
          </div>

          <div class="flex items-center space-x-2">
            <Checkbox id="isActive" v-model:checked="formData.isActive" />
            <Label for="isActive" class="cursor-pointer">Aktif</Label>
          </div>

          <!-- Options Section -->
          <Separator />
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <Label>Seçenekler</Label>
              <Badge variant="outline"
                >{{ formData.options.length }} seçenek</Badge
              >
            </div>

            <!-- Add Option Form -->
            <div class="grid gap-2 sm:grid-cols-4">
              <Input
                v-model="newOptionValue"
                placeholder="Değer (ör: red)"
                @keyup.enter.prevent="addOption"
              />
              <Input
                v-model="newOptionLabel"
                placeholder="Etiket (ör: Kırmızı)"
                @keyup.enter.prevent="addOption"
              />
              <Input
                v-if="formData.type === 'color'"
                v-model="newOptionColorCode"
                type="color"
                class="h-10 cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                @click="addOption"
                :class="{ 'sm:col-span-2': formData.type !== 'color' }"
              >
                <Plus class="h-4 w-4 mr-2" />
                Ekle
              </Button>
            </div>

            <!-- Options List -->
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="(option, index) in formData.options"
                :key="option.value"
                class="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <GripVertical
                    class="h-4 w-4 text-muted-foreground cursor-move"
                  />
                  <span
                    v-if="formData.type === 'color' && option.colorCode"
                    class="w-5 h-5 rounded border"
                    :style="{ backgroundColor: option.colorCode }"
                  />
                  <span class="font-medium">{{ option.label }}</span>
                  <span class="text-xs text-muted-foreground font-mono"
                    >({{ option.value }})</span
                  >
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive"
                  @click="removeOption(index)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
              <p
                v-if="formData.options.length === 0"
                class="text-center py-4 text-muted-foreground text-sm"
              >
                Henüz seçenek eklenmedi
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="showDialog = false">
              İptal
            </Button>
            <Button type="submit" :disabled="isSubmitting || !formData.label">
              {{ editingTemplate ? "Güncelle" : "Oluştur" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
