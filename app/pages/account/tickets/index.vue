<script setup lang="ts">
import { LifeBuoy, Plus, MessageSquare, ChevronRight } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

definePageMeta({
  layout: "account",
  middleware: "auth",
  name: "tickets",
});

useHead({
  title: "Destek Taleplerim | Hesabım",
});

const { data: ticketsData, pending } = await useFetch("/api/tickets");
const tickets = computed(() => ticketsData.value?.data || []);

function formatDate(date: number | Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "open": return "default"; // dark
    case "closed": return "secondary"; // gray
    case "pending": return "outline"; // white
    case "in_progress": return "destructive"; // red/orange
    default: return "secondary";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "open": return "Açık";
    case "closed": return "Kapalı";
    case "pending": return "Yanıt Bekliyor";
    case "in_progress": return "İşlemde";
    default: return status;
  }
};

const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
        order: "Sipariş",
        payment: "Ödeme",
        account: "Hesap",
        technical: "Teknik",
        other: "Diğer"
    };
    return labels[category] || category;
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Destek Taleplerim</h1>
        <p class="text-muted-foreground">Tüm sorularınız ve talepleriniz</p>
      </div>
      <Button asChild>
        <NuxtLink to="/account/tickets/create">
          <Plus class="w-4 h-4 mr-2" />
          Yeni Talep
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="tickets.length === 0" class="text-center py-16 border-2 border-dashed rounded-xl">
      <LifeBuoy class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">Henüz destek talebiniz yok</h2>
      <p class="text-muted-foreground mb-6">Bir sorunuz mu var? Hemen yeni bir talep oluşturun.</p>
      <Button asChild>
        <NuxtLink to="/account/tickets/create">Yeni Talep Oluştur</NuxtLink>
      </Button>
    </div>

    <!-- Tickets List -->
    <div v-else class="space-y-4">
      <div v-for="ticket in tickets" :key="ticket.id" class="group">
        <NuxtLink :to="`/account/tickets/${ticket.id}`">
            <Card class="hover:shadow-md transition-shadow">
            <CardHeader class="p-4 sm:p-6 pb-2 sm:pb-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold text-lg">{{ ticket.subject }}</h3>
                            <Badge variant="outline" class="text-xs font-normal">
                                {{ getCategoryLabel(ticket.category) }}
                            </Badge>
                        </div>
                        <p class="text-sm text-muted-foreground line-clamp-1">
                            Talep No: #{{ ticket.id.slice(0, 8) }} • {{ formatDate(new Date(ticket.createdAt)) }}
                        </p>
                    </div>
                    <Badge :variant="getStatusColor(ticket.status)" class="w-fit">
                        {{ getStatusLabel(ticket.status) }}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent class="p-4 sm:p-6 pt-2 sm:pt-2">
                <div v-if="ticket.order" class="mt-2 text-sm bg-muted/50 p-2 rounded flex items-center gap-2">
                    <Package class="w-4 h-4 text-muted-foreground" />
                    <span>İlgili Sipariş: <strong>{{ ticket.order.orderNumber }}</strong></span>
                </div>
            </CardContent>
            </Card>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
