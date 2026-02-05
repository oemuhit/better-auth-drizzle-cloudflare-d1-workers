<script setup lang="ts">
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { toast } from "vue-sonner";
import { ArrowLeft, Send, User, Lock, Loader2, Package } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { useIntervalFn } from "@vueuse/core";

definePageMeta({
  layout: "account",
  middleware: "auth",
  name: "ticket-detail",
});

useHead({
  title: "Destek Talebi Detayı | Hesabım",
});

const route = useRoute();
const ticketId = route.params.id as string;
const session = authClient.useSession();
const user = computed(() => session.value.data?.user);

const { data: ticketData, refresh, pending } = await useFetch(`/api/tickets/${ticketId}`);
const ticket = computed(() => ticketData.value?.data);

// Poll for new messages every 5 seconds
useIntervalFn(() => {
  refresh();
}, 5000);

const formSchema = toTypedSchema(
  z.object({
    message: z.string().min(1, "Mesaj boş olamaz"),
  })
);

const { handleSubmit, isSubmitting, resetForm, defineField } = useForm({
  validationSchema: formSchema,
});

const [message, messageProps] = defineField('message');

const messagesContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  if (messagesContainer.value) {
    setTimeout(() => {
      messagesContainer.value!.scrollTop = messagesContainer.value!.scrollHeight;
    }, 100);
  }
};

onMounted(() => {
  scrollToBottom();
});

watch(() => ticket.value?.messages, () => {
  scrollToBottom();
}, { deep: true });

const onSubmit = handleSubmit(async (values) => {
  try {
    const response = await $fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      body: values,
    });

    if (response.success) {
      toast.success("Mesajınız gönderildi");
      resetForm();
      await refresh();
    }
  } catch (error: any) {
    toast.error(error.data?.message || "Mesaj gönderilemedi");
  }
});

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
    case "closed": return "Kapalı (Çözüldü)";
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
  <div class="space-y-6 max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
    <!-- Header -->
    <div v-if="ticket" class="flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <NuxtLink to="/account/tickets">
            <ArrowLeft class="w-4 h-4" />
          </NuxtLink>
        </Button>
        <div>
          <h1 class="text-xl font-bold flex items-center gap-2">
            {{ ticket.subject }}
            <Badge variant="outline" class="font-normal text-xs">{{ getCategoryLabel(ticket.category) }}</Badge>
          </h1>
          <p class="text-sm text-muted-foreground flex items-center gap-2">
            Talep #{{ ticket.id.slice(0, 8) }}
            <span v-if="ticket.order" class="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs">
                <Package class="w-3 h-3" /> Sipariş: {{ ticket.order.orderNumber }}
            </span>
          </p>
        </div>
      </div>
      <Badge :variant="getStatusColor(ticket.status)">
        {{ getStatusLabel(ticket.status) }}
      </Badge>
    </div>

    <!-- Chat Area -->
    <Card class="flex-1 flex flex-col overflow-hidden min-h-0">
      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="pending" class="flex justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        
        <template v-else>
            <div v-for="(msg, index) in ticket?.messages" :key="msg.id" 
                class="flex gap-3" 
                :class="[msg.isAdmin ? 'flex-row' : 'flex-row-reverse']"
            >
            <Avatar class="w-8 h-8 mt-1 border">
                <AvatarImage v-if="!msg.isAdmin" :src="msg.sender?.image || ''" />
                <AvatarFallback :class="msg.isAdmin ? 'bg-primary text-primary-foreground' : ''">
                    <User v-if="!msg.isAdmin" class="w-4 h-4" />
                    <LifeBuoy v-else class="w-4 h-4" />
                </AvatarFallback>
            </Avatar>
            
            <div 
                class="max-w-[80%] rounded-lg p-3 text-sm"
                :class="[
                msg.isAdmin 
                    ? 'bg-muted text-foreground rounded-tl-none' 
                    : 'bg-primary text-primary-foreground rounded-tr-none'
                ]"
            >
                <div class="font-medium text-xs mb-1 opacity-80 flex justify-between gap-4">
                    <span>{{ msg.isAdmin ? 'Destek Ekibi' : msg.sender?.name || 'Siz' }}</span>
                    <span>{{ new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }}</span>
                </div>
                <p class="whitespace-pre-wrap">{{ msg.message }}</p>
            </div>
            </div>
            
            <div v-if="ticket?.status === 'closed'" class="text-center py-4">
                <Badge variant="secondary" class="mx-auto">Bu destek talebi kapatılmıştır.</Badge>
            </div>
        </template>
      </div>

      <!-- Reply Input -->
      <div class="p-4 border-t bg-background shrink-0">
        <form @submit="onSubmit" class="flex gap-2">
          <Input 
            name="message" 
            v-model="message"
            v-bind="messageProps"
            :disabled="isSubmitting || ticket?.status === 'closed'"
            placeholder="Mesajınızı yazın..." 
            class="flex-1"
            autocomplete="off"
          />
          <Button type="submit" :disabled="isSubmitting || ticket?.status === 'closed'">
            <Send class="w-4 h-4" />
            <span class="sr-only">Gönder</span>
          </Button>
        </form>
      </div>
    </Card>
  </div>
</template>
