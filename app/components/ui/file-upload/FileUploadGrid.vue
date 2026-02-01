<script lang="ts" setup>
import type { HTMLAttributes } from "vue";

interface FileUploadGridProps {
  class?: HTMLAttributes["class"];
  files?: File[];
}

const props = defineProps<FileUploadGridProps>();

const ROWS = 11;
const COLUMNS = 41;

const filePreviews = ref<string[]>([]);

watch(() => props.files, (newFiles) => {
  // Revoke old URLs
  filePreviews.value.forEach(url => URL.revokeObjectURL(url));
  
  if (newFiles) {
    filePreviews.value = newFiles.map(file => URL.createObjectURL(file));
  } else {
    filePreviews.value = [];
  }
}, { immediate: true });

onBeforeUnmount(() => {
  filePreviews.value.forEach(url => URL.revokeObjectURL(url));
});
</script>

<template>
  <div
    class="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-px bg-gray-100 dark:bg-neutral-900"
    :class="[$props.class]"
  >
    <template v-for="row in ROWS">
      <template
        v-for="col in COLUMNS"
        :key="`${row}-${col}`"
      >
        <div
          class="flex h-10 w-10 flex-shrink-0 rounded-[2px] overflow-hidden relative"
          :class="[
            ((row - 1) * COLUMNS + (col - 1)) % 2 === 0
              ? 'bg-gray-50 dark:bg-neutral-950'
              : 'bg-gray-50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:bg-neutral-950 dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]',
          ]"
        >
          <img 
            v-if="filePreviews[((row - 1) * COLUMNS + (col - 1)) % filePreviews.length] && filePreviews.length > 0"
            :src="filePreviews[((row - 1) * COLUMNS + (col - 1)) % filePreviews.length]"
            class="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        </div>
      </template>
    </template>
  </div>
</template>
