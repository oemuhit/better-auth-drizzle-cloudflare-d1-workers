<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { Motion } from "motion-v";
import { ref } from "vue";
import resize from "@jsquash/resize";
import { encode as encodeWebP } from "@jsquash/webp";

interface FileUploadProps {
  class?: HTMLAttributes["class"];
}

defineProps<FileUploadProps>();

import { toast } from "vue-sonner";

const emit = defineEmits<{
  (e: "onChange", files: File[]): void;
  (e: "onUploadComplete", imageId: string): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const files = ref<File[]>([]);
const isActive = ref<boolean>(false);

const { isUploading, uploadImage } = useImageUpload()

async function handleFileChange(newFiles: File[]) {
  files.value = [...files.value, ...newFiles];
  emit("onChange", files.value);
  
  if (newFiles.length > 0) {
    await uploadImages(newFiles);
  }
}

async function uploadImages(filesToUpload: File[]) {
  console.log('Starting upload for', filesToUpload.length, 'files');
  try {
    for (const file of filesToUpload) {
      console.log('Processing file:', file.name);
      const response = await uploadImage(file)

      console.log('API Response:', response);
      if (response?.success) {
        emit('onUploadComplete', response.imageId);
      }
    }
  } catch (err: any) {
    // Generic error fallback
    console.error('GridFS Upload Error:', err);
    toast.error('Yükleme hatası: ' + (err.message || 'Bilinmeyen hata'));
  } finally {
    console.log('Upload process finished');
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;
  handleFileChange(Array.from(input.files));
}

function handleClick() {
  fileInputRef.value?.click();
}

function handleEnter() {
  isActive.value = true;
}
function handleLeave() {
  isActive.value = false;
}
function handleDrop(e: DragEvent) {
  isActive.value = false;
  const droppedFiles = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
  if (droppedFiles.length) handleFileChange(droppedFiles);
}
</script>

<template>
  <ClientOnly>
    <div
      class="w-full"
      :class="[$props.class]"
      @dragover.prevent="handleEnter"
      @dragleave="handleLeave"
      @drop.prevent="handleDrop"
      @mouseover="handleEnter"
      @mouseleave="handleLeave"
    >
      <div
        class="group/file relative block w-full cursor-pointer overflow-hidden rounded-lg p-4"
        @click="handleClick"
      >
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          accept="image/*"
          @change="onFileChange"
        />
        
        <div v-if="isUploading" class="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-black/50">
           <Icon name="heroicons:arrow-path" class="h-10 w-10 animate-spin text-primary" />
        </div>

        <!-- Grid pattern -->
        <div
          class="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
        >
          <slot :files="files" />
        </div>

        <!-- Content -->
        <div class="flex flex-col items-center justify-center">
          <p
            class="relative z-20 font-sans text-sm font-bold text-neutral-700 dark:text-neutral-300"
          >
            Upload file
          </p>
          <p
            class="relative z-20 mt-1 font-sans text-xs font-normal text-neutral-400 dark:text-neutral-400"
          >
            Drag & drop or click
          </p>

          <div class="relative mx-auto mt-4 w-full max-w-xl space-y-2">
            <Motion
              v-for="(file, idx) in files"
              :key="`file-${idx}`"
              :initial="{ opacity: 0, scaleX: 0 }"
              :animate="{ opacity: 1, scaleX: 1 }"
              class="relative z-40 mx-auto flex w-full flex-col items-start justify-start overflow-hidden rounded-md bg-white p-2 shadow-sm md:h-16 dark:bg-neutral-900"
            >
              <div class="flex w-full items-center justify-between gap-4">
                <Motion
                  as="p"
                  :initial="{ opacity: 0 }"
                  :animate="{ opacity: 1 }"
                  class="max-w-xs truncate text-sm text-neutral-700 dark:text-neutral-300"
                >
                  {{ file.name }}
                </Motion>
                <Motion
                  as="p"
                  :initial="{ opacity: 0 }"
                  :animate="{ opacity: 1 }"
                  class="shadow-input w-fit shrink-0 rounded-lg px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-white"
                >
                  {{ (file.size / (1024 * 1024)).toFixed(2) }} MB
                </Motion>
              </div>

              <div
                class="mt-1 flex w-full flex-col items-start justify-between text-xs text-neutral-600 md:flex-row md:items-center dark:text-neutral-400"
              >
                <Motion
                  as="p"
                  :initial="{ opacity: 0 }"
                  :animate="{ opacity: 1 }"
                  class="rounded-md bg-gray-100 px-1 py-0.5 dark:bg-neutral-800"
                >
                  {{ file.type || "unknown type" }}
                </Motion>
                <Motion
                  as="p"
                  :initial="{ opacity: 0 }"
                  :animate="{ opacity: 1 }"
                >
                  {{ new Date(file.lastModified).toLocaleDateString() }}
                </Motion>
              </div>
            </Motion>

            <template v-if="!files.length">
              <Motion
                as="div"
                class="relative z-40 mx-auto mt-2 flex h-20 w-full max-w-24 items-center justify-center rounded-md bg-white shadow-[0px_10px_50px_rgba(0,0,0,0.1)] group-hover/file:shadow-2xl dark:bg-neutral-900"
                :initial="{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }"
                :transition="{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }"
                :animate="
                  isActive
                    ? {
                        x: 20,
                        y: -20,
                        opacity: 0.9,
                      }
                    : {}
                "
              >
                <Icon
                  name="heroicons:arrow-up-tray-20-solid"
                  class="text-neutral-600 dark:text-neutral-400"
                  size="20"
                />
              </Motion>

              <div
                class="absolute inset-0 z-30 mx-auto mt-2 flex h-20 w-full max-w-24 items-center justify-center rounded-md border border-dashed border-sky-400 bg-transparent transition-opacity"
                :class="{ 'opacity-100': isActive, 'opacity-0': !isActive }"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.group-hover\/file\:shadow-2xl:hover {
  box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.25);
}

.transition-opacity {
  transition: opacity 0.3s ease;
}
</style>
