<script setup lang="ts">
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { toast } from "vue-sonner";
import { ArrowLeft, Loader2, Send } from "lucide-vue-next";
import { Label } from "@/components/ui/label";

definePageMeta({
  layout: "account",
  middleware: "auth",
  name: "create-ticket",
});

useHead({
  title: "Yeni Destek Talebi | Hesabım",
});

const route = useRoute();
const router = useRouter();
const queryOrderId = route.query.orderId as string;

// Fetch user's orders for the dropdown
const { data: ordersData } = await useFetch("/api/orders");
const orders = computed(() => ordersData.value?.data || []);

const formSchema = toTypedSchema(
  z.object({
    subject: z.string().min(5, "Konu en az 5 karakter olmalıdır").max(100, "Konu en fazla 100 karakter olabilir"),
    category: z.enum(["order", "payment", "account", "technical", "other"], {
      required_error: "Lütfen bir kategori seçin",
    }),
    orderId: z.string().optional(),
    message: z.string().min(10, "Mesajınız en az 10 karakter olmalıdır"),
  })
);

const { handleSubmit, isSubmitting, defineField, errors, meta } = useForm({
  validationSchema: formSchema,
  initialValues: {
    category: "order",
    orderId: queryOrderId || undefined,
  },
});

const [subject, subjectProps] = defineField("subject");
const [category, categoryProps] = defineField("category");
const [orderId, orderIdProps] = defineField("orderId");
const [message, messageProps] = defineField("message");

const onSubmit = handleSubmit(async (values) => {
  try {
    const response = await $fetch("/api/tickets", {
      method: "POST",
      body: values,
    });

    if (response.success) {
      toast.success("Destek talebiniz oluşturuldu");
      router.push(`/account/tickets/${response.data.id}`);
    }
  } catch (error: any) {
    toast.error(error.data?.message || "Bir hata oluştu");
  }
});
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <NuxtLink to="/account/tickets">
          <ArrowLeft class="w-4 h-4" />
        </NuxtLink>
      </Button>
      <div>
        <h1 class="text-2xl font-bold">Yeni Destek Talebi</h1>
        <p class="text-muted-foreground">Size nasıl yardımcı olabiliriz?</p>
      </div>
    </div>

    <Card>
      <CardContent class="p-6">
        <form @submit="onSubmit" class="space-y-6">
          <div class="space-y-2">
            <Label for="subject">Konu</Label>
            <Input 
              id="subject" 
              type="text" 
              placeholder="Örn: Siparişim kargoya verilmedi" 
              v-model="subject"
              v-bind="subjectProps"
              :aria-invalid="!!errors.subject"
            />
            <p v-if="errors.subject" class="text-sm font-medium text-destructive">
                {{ errors.subject }}
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="space-y-2">
                <Label for="category">Kategori</Label>
                <Select v-model="category" v-bind="categoryProps">
                    <SelectTrigger id="category" :class="{'border-destructive': errors.category}">
                        <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="order">Sipariş Sorunları</SelectItem>
                    <SelectItem value="payment">Ödeme İşlemleri</SelectItem>
                    <SelectItem value="account">Hesap İşlemleri</SelectItem>
                    <SelectItem value="technical">Teknik Sorun</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                </Select>
                <p v-if="errors.category" class="text-sm font-medium text-destructive">
                    {{ errors.category }}
                </p>
            </div>

            <div class="space-y-2">
                <Label for="orderId">İlgili Sipariş (Opsiyonel)</Label>
                <Select v-model="orderId" v-bind="orderIdProps">
                    <SelectTrigger id="orderId" :class="{'border-destructive': errors.orderId}" class="w-full">
                        <SelectValue placeholder="Sipariş seçin" class="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Seçiniz</SelectItem>
                        <SelectItem v-for="order in orders" :key="order.id" :value="order.id" class="truncate">
                            <span class="truncate block w-full max-w-[200px] sm:max-w-md">
                                #{{ order.orderNumber }} - {{ new Date(order.createdAt).toLocaleDateString("tr-TR") }}
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <p v-if="errors.orderId" class="text-sm font-medium text-destructive">
                    {{ errors.orderId }}
                </p>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="message">Mesajınız</Label>
            <Textarea 
                id="message"
                placeholder="Detaylı bilgi veriniz..." 
                class="resize-none min-h-[150px]" 
                v-model="message"
                v-bind="messageProps"
                :aria-invalid="!!errors.message"
            />
            <p v-if="errors.message" class="text-sm font-medium text-destructive">
                {{ errors.message }}
            </p>
          </div>

          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" @click="$router.push('/account/tickets')">
              İptal
            </Button>
            <Button type="submit" :disabled="isSubmitting || !meta.valid">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
              <Send v-else class="w-4 h-4 mr-2" />
              Talebi Gönder
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
