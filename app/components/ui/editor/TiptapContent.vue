<script setup lang="ts">
defineProps<{
  content: string;
}>();
</script>

<template>
  <div class="prose prose-sm dark:prose-invert max-w-none" v-html="content"></div>
</template>

<style scoped>
@reference "../../../assets/css/tailwind.css";

/* Ensure Tiptap-specific HTML elements are styled correctly in the rendered view */
.prose img {
  @apply rounded-lg my-4;
}

.prose blockquote {
  @apply border-l-4 border-primary pl-4 py-2 italic;
}

.prose pre {
  @apply bg-muted p-4 rounded-lg my-4 font-mono text-sm;
}
</style>
