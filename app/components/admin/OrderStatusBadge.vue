<script setup lang="ts">
const props = defineProps<{
  status: string;
  type?: "status" | "payment" | "fulfillment";
}>();

const statusConfig = computed(() => {
  if (props.type === "payment") {
    return (
      {
        not_paid: { label: "Ödenmedi", variant: "destructive" as const },
        awaiting: { label: "Bekliyor", variant: "secondary" as const },
        paid: { label: "Ödendi", variant: "default" as const },
        refunded: { label: "İade Edildi", variant: "outline" as const },
      }[props.status] || { label: props.status, variant: "secondary" as const }
    );
  }

  if (props.type === "fulfillment") {
    return (
      {
        open: { label: "Açık", variant: "secondary" as const },
        in_progress: { label: "Hazırlanıyor", variant: "default" as const },
        fulfilled: { label: "Tamamlandı", variant: "default" as const },
        on_hold: { label: "Beklemede", variant: "destructive" as const },
      }[props.status] || { label: props.status, variant: "secondary" as const }
    );
  }

  // Default: order status
  return (
    {
      pending: { label: "Bekliyor", variant: "secondary" as const },
      processing: { label: "İşleniyor", variant: "default" as const },
      completed: { label: "Tamamlandı", variant: "default" as const },
      cancelled: { label: "İptal Edildi", variant: "destructive" as const },
      archived: { label: "Arşivlendi", variant: "outline" as const },
    }[props.status] || { label: props.status, variant: "secondary" as const }
  );
});
</script>

<template>
  <Badge :variant="statusConfig.variant">
    {{ statusConfig.label }}
  </Badge>
</template>
