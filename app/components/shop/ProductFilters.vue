<script setup lang="ts">
import { Search, X, SlidersHorizontal } from "lucide-vue-next";

const props = defineProps<{
  modelValue: {
    search: string;
    sortBy: string;
    sortOrder: string;
  };
}>();

const emit = defineEmits<{
  "update:modelValue": [value: typeof props.modelValue];
}>();

const localFilters = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const searchInput = ref(props.modelValue.search);

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchInput, (val) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    localFilters.value = { ...localFilters.value, search: val };
  }, 300);
});

const sortOptions = [
  { label: "En Yeni", value: "createdAt-desc" },
  { label: "En Eski", value: "createdAt-asc" },
  { label: "Fiyat: Düşükten Yükseğe", value: "price-asc" },
  { label: "Fiyat: Yüksekten Düşüğe", value: "price-desc" },
  { label: "A-Z", value: "title-asc" },
  { label: "Z-A", value: "title-desc" },
];

const currentSort = computed({
  get: () => `${localFilters.value.sortBy}-${localFilters.value.sortOrder}`,
  set: (val) => {
    const [sortBy, sortOrder] = val.split("-");
    localFilters.value = { ...localFilters.value, sortBy, sortOrder };
  },
});

function clearSearch() {
  searchInput.value = "";
  localFilters.value = { ...localFilters.value, search: "" };
}
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-4">
    <!-- Search -->
    <div class="relative flex-1">
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
      />
      <Input
        v-model="searchInput"
        type="search"
        placeholder="Ürün ara..."
        class="pl-9 pr-9"
      />
      <button
        v-if="searchInput"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        @click="clearSearch"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Sort -->
    <Select v-model="currentSort">
      <SelectTrigger class="w-full sm:w-[200px]">
        <SlidersHorizontal class="h-4 w-4 mr-2" />
        <SelectValue placeholder="Sırala" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in sortOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
