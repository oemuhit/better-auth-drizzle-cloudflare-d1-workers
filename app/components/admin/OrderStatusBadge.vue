<script setup lang="ts">
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Archive, 
  RefreshCcw, 
  CreditCard, 
  Truck, 
  PackageCheck, 
  AlertCircle,
  PackageSearch
} from "lucide-vue-next";

const props = defineProps<{
  status: string;
  type?: "status" | "payment" | "fulfillment";
  size?: "sm" | "default";
}>();

const config = computed(() => {
  if (props.type === "payment") {
    return (
      {
        not_paid: { 
          label: "Ödenmedi", 
          icon: CreditCard,
          class: "bg-red-50 text-red-700 border-red-200" 
        },
        awaiting: { 
          label: "Bekliyor", 
          icon: Clock,
          class: "bg-amber-50 text-amber-700 border-amber-200" 
        },
        paid: { 
          label: "Ödendi", 
          icon: CheckCircle2,
          class: "bg-emerald-50 text-emerald-700 border-emerald-200" 
        },
        refunded: { 
          label: "İade Edildi", 
          icon: RefreshCcw,
          class: "bg-slate-100 text-slate-700 border-slate-200" 
        },
      }[props.status] || { 
        label: props.status, 
        icon: AlertCircle,
        class: "bg-slate-100 text-slate-700 border-slate-200" 
      }
    );
  }

  if (props.type === "fulfillment") {
    return (
      {
        open: { 
          label: "Açık", 
          icon: PackageSearch,
          class: "bg-blue-50 text-blue-700 border-blue-200" 
        },
        in_progress: { 
          label: "Hazırlanıyor", 
          icon: Clock,
          class: "bg-amber-50 text-amber-700 border-amber-200" 
        },
        fulfilled: { 
          label: "Tamamlandı", 
          icon: PackageCheck,
          class: "bg-emerald-50 text-emerald-700 border-emerald-200" 
        },
        on_hold: { 
          label: "Beklemede", 
          icon: AlertCircle,
          class: "bg-red-50 text-red-700 border-red-200" 
        },
      }[props.status] || { 
        label: props.status, 
        icon: Truck,
        class: "bg-slate-100 text-slate-700 border-slate-200" 
      }
    );
  }

  // Default: order status
  return (
    {
      pending: { 
        label: "Bekliyor", 
        icon: Clock,
        class: "bg-amber-50 text-amber-700 border-amber-200" 
      },
      processing: { 
        label: "İşleniyor", 
        icon: RefreshCcw,
        class: "bg-blue-50 text-blue-700 border-blue-200" 
      },
      completed: { 
        label: "Tamamlandı", 
        icon: CheckCircle2,
        class: "bg-emerald-50 text-emerald-700 border-emerald-200" 
      },
      cancelled: { 
        label: "İptal Edildi", 
        icon: XCircle,
        class: "bg-red-50 text-red-700 border-red-200" 
      },
      archived: { 
        label: "Arşivlendi", 
        icon: Archive,
        class: "bg-slate-100 text-slate-700 border-slate-200" 
      },
    }[props.status] || { 
      label: props.status, 
      icon: AlertCircle,
      class: "bg-slate-100 text-slate-700 border-slate-200" 
    }
  );
});
</script>

<template>
  <div 
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors shadow-sm"
    :class="[
      config.class,
      size === 'sm' ? 'px-2 py-0 text-[10px]' : ''
    ]"
  >
    <component :is="config.icon" class="w-3.5 h-3.5" :class="size === 'sm' ? 'w-3 h-3' : ''" />
    <span class="uppercase tracking-tight">{{ config.label }}</span>
  </div>
</template>
