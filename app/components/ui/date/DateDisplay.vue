<script setup lang="ts">
import { useNow, useDateFormat } from '@vueuse/core'
import { Calendar } from 'lucide-vue-next'

interface Props {
  format?: string
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  format: 'MMMM D, YYYY',
  showIcon: true,
})

const now = useNow()
const formattedDate = useDateFormat(now, props.format)
</script>

<template>
  <div 
    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/50 backdrop-blur-sm border border-border shadow-sm hover:shadow-md transition-all duration-300 group"
  >
    <div 
      v-if="showIcon"
      class="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
    >
      <Calendar class="w-4 h-4" />
    </div>
    <span class="text-sm font-semibold tracking-tight text-foreground/90 tabular-nums">
      {{ formattedDate }}
    </span>
  </div>
</template>
