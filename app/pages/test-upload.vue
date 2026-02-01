<script setup lang="ts">
const uploadedImageId = ref<string | null>(null);

function onUploadComplete(id: string) {
  uploadedImageId.value = id;
}
</script>

<template>
  <div class="container mx-auto py-10 space-y-10">
    <h1 class="text-3xl font-bold">Image Upload Test</h1>
    
    <div class="max-w-xl mx-auto border rounded-xl p-6 bg-card">
      <FileUpload @onUploadComplete="onUploadComplete">
        <template #default="{ files }">
          <FileUploadGrid :files="files" />
        </template>
      </FileUpload>
    </div>

    <div v-if="uploadedImageId" class="space-y-6">
      <h2 class="text-2xl font-semibold">Uploaded Previews (Nuxt Image)</h2>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="space-y-2">
          <p class="text-sm font-medium">Thumbnail (256w)</p>
          <NuxtImg 
            :src="uploadedImageId" 
            preset="thumbnail"
            class="rounded-lg border shadow-sm w-full object-cover aspect-square"
          />
        </div>
        
        <div class="space-y-2">
          <p class="text-sm font-medium">Medium (512w)</p>
          <NuxtImg 
            :src="uploadedImageId" 
            preset="medium"
            class="rounded-lg border shadow-sm w-full object-cover aspect-square"
          />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium">Responsive</p>
          <NuxtImg 
            :src="uploadedImageId" 
            sizes="sm:160px md:512px lg:1024px"
            class="rounded-lg border shadow-sm w-full object-cover aspect-video"
          />
        </div>
      </div>
    </div>
  </div>
</template>
