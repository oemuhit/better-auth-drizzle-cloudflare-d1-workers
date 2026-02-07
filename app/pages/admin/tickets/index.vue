<script setup lang="ts">
import { LifeBuoy, MoreVertical, MessageSquare } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
  name: "admin-tickets",
});

useHead({
  title: "Destek Talepleri | Admin",
});

const { data: ticketsData, refresh, pending } = await useFetch("/api/admin/tickets", {
  headers: useRequestHeaders(['cookie']),
});
const tickets = computed(() => ticketsData.value?.data || []);

function formatDate(date: number | Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "open": return "default";
    case "closed": return "secondary";
    case "pending": return "outline";
    case "in_progress": return "destructive";
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
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Destek Talepleri</h1>
      <p class="text-muted-foreground">Kullanıcı taleplerini yönetin</p>
    </div>

    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Konu</TableHead>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead class="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="pending">
                <TableCell colspan="6" class="text-center py-8">
                    <Loader2 class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
            </TableRow>
            <TableRow v-else-if="tickets.length === 0">
                <TableCell colspan="6" class="text-center py-8">
                    <p class="text-muted-foreground">Henüz destek talebi yok.</p>
                </TableCell>
            </TableRow>
            <TableRow v-for="ticket in tickets" :key="ticket.id">
              <TableCell class="font-medium">#{{ ticket.id.slice(0,8) }}</TableCell>
              <TableCell>
                <div class="flex flex-col">
                  <span class="font-medium">{{ ticket.subject }}</span>
                  <span class="text-xs text-muted-foreground capitalize">{{ ticket.category }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex flex-col">
                    <span class="text-sm font-medium">{{ ticket.user.name }}</span>
                    <span class="text-xs text-muted-foreground">{{ ticket.user.email }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusColor(ticket.status)">
                  {{ getStatusLabel(ticket.status) }}
                </Badge>
              </TableCell>
              <TableCell>{{ formatDate(new Date(ticket.createdAt)) }}</TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" class="h-8 w-8 p-0">
                      <span class="sr-only">Menüyü aç</span>
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="navigateTo(`/admin/tickets/${ticket.id}`)">
                         Görüntüle & Yanıtla
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
