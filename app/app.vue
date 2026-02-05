<script setup lang="ts">


import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'



</script>

<template>
  <div class="relative min-h-screen">
    <NuxtLoadingIndicator color="#10b981" :height="3" />
    <NuxtRouteAnnouncer />
    

    
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global Sonner Notifications (Shadcn version) -->
    <ClientOnly>
      <Toaster position="bottom-center" rich-colors close-button />
    </ClientOnly>
  </div>
</template>
