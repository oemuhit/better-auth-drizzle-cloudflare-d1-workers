<script setup lang="ts">
import type { LucideIcon } from "lucide-vue-next";

defineProps<{
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}>();
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="text-sm font-medium text-muted-foreground">
        {{ title }}
      </CardTitle>
      <component :is="icon" v-if="icon" class="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold">{{ value }}</div>
      <p v-if="description" class="text-xs text-muted-foreground mt-1">
        {{ description }}
      </p>
      <div
        v-if="trend"
        class="flex items-center text-xs mt-1"
        :class="[trend.isPositive ? 'text-green-600' : 'text-red-600']"
      >
        <span>{{ trend.isPositive ? "+" : "" }}{{ trend.value }}%</span>
        <span class="text-muted-foreground ml-1">geçen aya göre</span>
      </div>
    </CardContent>
  </Card>
</template>
