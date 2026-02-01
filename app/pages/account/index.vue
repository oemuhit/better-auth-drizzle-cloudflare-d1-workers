<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

onMounted(() => {
  navigateTo("/account/profile");
});
</script>

<template>
  <div class="flex items-center justify-center min-h-[50vh]">
    <Loader2 class="h-8 w-8 animate-spin text-primary" />
  </div>
</template>
