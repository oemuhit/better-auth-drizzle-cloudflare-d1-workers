<script setup lang="ts">
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { toast } from "vue-sonner";
import { ArrowLeft, Send, User, LifeBuoy, Loader2, Package } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIntervalFn, useDocumentVisibility } from "@vueuse/core";

const router = useRouter();

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
  name: "admin-ticket-detail",
});

useHead({
  title: "Talep Detayı | Admin",
});

const route = useRoute();
const ticketId = route.params.id as string;
const session = authClient.useSession();
const user = computed(() => session.value.data?.user);

const { data: ticketData, refresh, pending } = await useFetch(`/api/admin/tickets/${ticketId}`);
const ticket = computed(() => ticketData.value?.data);

// Track document visibility
const visibility = useDocumentVisibility();

// Track last message timestamp for inactivity detection
const lastMessageCount = ref(ticket.value?.messages?.length || 0);
const lastActivityTime = ref(Date.now());

// 1 minutes in milliseconds
const INACTIVITY_TIMEOUT = 1 * 60 * 1000;

// Poll for new messages every 5 seconds, but only when tab is active
const { pause, resume } = useIntervalFn(() => {
  // Check for inactivity - redirect if no new messages for 1 minute
  if (Date.now() - lastActivityTime.value > INACTIVITY_TIMEOUT) {
    router.push('/admin/tickets');
    return;
  }
  
  refresh();
}, 5000);

// Watch for new messages to reset activity timer
watch(() => ticket.value?.messages?.length, (newCount, oldCount) => {
  if (newCount !== oldCount) {
    lastActivityTime.value = Date.now();
    lastMessageCount.value = newCount || 0;
  }
});

// Pause polling when tab is not visible
watch(visibility, (current) => {
  if (current === 'hidden') {
    pause();
  } else {
    resume();
    // Reset activity time when user comes back to tab
    lastActivityTime.value = Date.now();
  }
});

// --- Reply Form ---
const messageSchema = toTypedSchema(
  z.object({
    message: z.string().min(1, "Mesaj boş olamaz"),
  })
);

const { handleSubmit: handleReply, isSubmitting: isReplying, resetForm, defineField } = useForm({
  validationSchema: messageSchema,
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

const onReply = handleReply(async (values) => {
  try {
    const response = await $fetch(`/api/admin/tickets/${ticketId}/messages`, {
      method: "POST",
      body: values,
    });

    if (response.success) {
      toast.success("Yanıt gönderildi");
      resetForm();
      await refresh();
    }
  } catch (error: any) {
    toast.error(error.data?.message || "Mesaj gönderilemedi");
  }
});

// --- Status Update ---
const isUpdatingStatus = ref(false);

const updateStatus = async (newStatus: string) => {
  if (!ticket.value || ticket.value.status === newStatus) return;

  isUpdatingStatus.value = true;
  try {
    const response = await $fetch(`/api/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: { status: newStatus },
    });
    
    if (response.success) {
      toast.success("Talep durumu güncellendi");
      await refresh();
    }
  } catch (error: any) {
    toast.error("Durum güncellenemedi");
  } finally {
    isUpdatingStatus.value = false;
  }
};

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
  <div class="h-[calc(100vh-100px)] flex flex-col space-y-4">
    <!-- Header -->
    <div v-if="ticket" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background p-4 rounded-lg border shrink-0">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <NuxtLink to="/admin/tickets">
            <ArrowLeft class="w-4 h-4" />
          </NuxtLink>
        </Button>
        <div>
          <h1 class="text-xl font-bold flex items-center gap-2">
            {{ ticket.subject }}
          </h1>
          <div class="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{{ (ticket as any)?.user?.name }} ({{ (ticket as any)?.user?.email }})</span>
            <span v-if="ticket.order" class="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs ml-2">
                <Package class="w-3 h-3" /> Sipariş: {{ ticket.order.orderNumber }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Durum:</span>
        <Select :model-value="ticket.status" @update:model-value="(v) => updateStatus(v as string)">
            <SelectTrigger class="w-[180px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="open">Açık</SelectItem>
                <SelectItem value="in_progress">İşlemde</SelectItem>
                <SelectItem value="pending">Yanıt Bekliyor</SelectItem>
                <SelectItem value="closed">Kapalı</SelectItem>
            </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Chat Area -->
    <Card class="flex-1 flex flex-col overflow-hidden min-h-0">
      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        <div v-if="pending" class="flex justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        
        <template v-else>
            <div v-for="msg in ticket?.messages" :key="msg.id" 
                class="flex gap-3" 
                :class="[msg.isAdmin ? 'flex-row-reverse' : 'flex-row']"
            >
            <Avatar class="w-8 h-8 mt-1 border">
                <AvatarImage v-if="!msg.isAdmin" :src="msg.sender?.image || ''" />
                <AvatarFallback :class="msg.isAdmin ? 'bg-primary text-primary-foreground' : ''">
                    <LifeBuoy v-if="msg.isAdmin" class="w-4 h-4" />
                    <User v-else class="w-4 h-4" />
                </AvatarFallback>
            </Avatar>
            
            <div 
                class="max-w-[80%] rounded-lg p-3 text-sm"
                :class="[
                msg.isAdmin 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-background border rounded-tl-none'
                ]"
            >
                <div class="font-medium text-xs mb-1 opacity-80 flex justify-between gap-4">
                    <span>{{ msg.isAdmin ? 'Siz (Admin)' : msg.sender?.name }}</span>
                    <span>{{ new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }}</span>
                </div>
                <p class="whitespace-pre-wrap">{{ msg.message }}</p>
            </div>
            </div>
        </template>
      </div>

      <!-- Reply Input -->
      <div class="p-4 border-t bg-background shrink-0">
        <form @submit="onReply" class="flex gap-2">
          <Input 
            name="message" 
            v-model="message"
            v-bind="messageProps"
            placeholder="Yanıtınızı yazın..." 
            class="flex-1"
            autocomplete="off"
          />
          <Button type="submit" :disabled="isReplying">
            <Send class="w-4 h-4" />
            <span class="sr-only">Gönder</span>
          </Button>
        </form>
      </div>
    </Card>
  </div>
</template>
