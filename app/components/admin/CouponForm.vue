<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as zod from "zod";

const props = defineProps<{
  coupon?: any;
}>();

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const isSubmitting = ref(false);
const serverError = ref<string | null>(null);

const schema = zod.object({
  code: zod.string().min(3, "En az 3 karakter olmalıdır"),
  discountType: zod.enum(["percentage", "fixed"]),
  discountValue: zod.number().min(0, "Negatif olamaz"),
  minPurchaseAmount: zod.number().min(0).optional().default(0),
  startDate: zod.string().optional().nullable(),
  endDate: zod.string().optional().nullable(),
  isNewUserOnly: zod.boolean().default(false),
  isFirstPurchaseOnly: zod.boolean().default(false),
  usageLimitPerUser: zod.number().min(0).optional().default(1),
  usageLimitTotal: zod.number().min(0).optional().nullable(),
  isActive: zod.boolean().default(true),
});

const { handleSubmit, errors, defineField, setValues } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: props.coupon ? {
    ...props.coupon,
    startDate: props.coupon.startDate ? new Date(props.coupon.startDate).toISOString().slice(0, 16) : null,
    endDate: props.coupon.endDate ? new Date(props.coupon.endDate).toISOString().slice(0, 16) : null,
  } : {
    code: "",
    discountType: "percentage",
    discountValue: 0,
    minPurchaseAmount: 0,
    isNewUserOnly: false,
    isFirstPurchaseOnly: false,
    usageLimitPerUser: 1,
    isActive: true,
  },
});

const [code] = defineField("code");
const [discountType] = defineField("discountType");
const [discountValue] = defineField("discountValue");
const [minPurchaseAmount] = defineField("minPurchaseAmount");
const [startDate] = defineField("startDate");
const [endDate] = defineField("endDate");
const [isNewUserOnly] = defineField("isNewUserOnly");
const [isFirstPurchaseOnly] = defineField("isFirstPurchaseOnly");
const [usageLimitPerUser] = defineField("usageLimitPerUser");
const [usageLimitTotal] = defineField("usageLimitTotal");
const [isActive] = defineField("isActive");

const onSubmit = handleSubmit(async (values) => {
  isSubmitting.value = true;
  serverError.value = null;
  try {
    emit("submit", values);
  } catch (error: any) {
    serverError.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
});

defineExpose({
  setServerError: (error: string) => {
    serverError.value = error;
    isSubmitting.value = false;
  },
});
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <Alert v-if="serverError" variant="destructive">
      <AlertTitle>Hata</AlertTitle>
      <AlertDescription>{{ serverError }}</AlertDescription>
    </Alert>

    <div class="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="code">Kupon Kodu *</Label>
            <Input
              id="code"
              v-model="code"
              placeholder="Örn: YAZ2024"
              class="font-mono uppercase"
              :class="{ 'border-destructive': errors.code }"
            />
            <p v-if="errors.code" class="text-xs text-destructive">{{ errors.code }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>İndirim Tipi</Label>
              <Select v-model="discountType">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yüzde (%)</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar (TL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>İndirim Değeri</Label>
              <Input
                v-model.number="discountValue"
                type="number"
                step="0.01"
                :class="{ 'border-destructive': errors.discountValue }"
              />
              <p v-if="errors.discountValue" class="text-xs text-destructive">{{ errors.discountValue }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Minimum Sepet Tutarı</Label>
            <Input v-model.number="minPurchaseAmount" type="number" step="0.01" />
          </div>

          <div class="flex items-center space-x-2 pt-2">
            <Checkbox id="isActive" :checked="isActive" @update:checked="isActive = $event" />
            <Label for="isActive" class="cursor-pointer">Kupon Aktif</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kısıtlamalar ve Süre</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Input v-model="startDate" type="datetime-local" />
            </div>
            <div class="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Input v-model="endDate" type="datetime-local" />
            </div>
          </div>

          <div class="space-y-4 pt-2">
            <div class="flex items-center space-x-2">
              <Checkbox id="isNewUserOnly" :checked="isNewUserOnly" @update:checked="isNewUserOnly = $event" />
              <Label for="isNewUserOnly" class="cursor-pointer font-normal">Sadece Yeni Üyeler</Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox id="isFirstPurchaseOnly" :checked="isFirstPurchaseOnly" @update:checked="isFirstPurchaseOnly = $event" />
              <Label for="isFirstPurchaseOnly" class="cursor-pointer font-normal">Sadece İlk Alışveriş</Label>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 pt-2">
            <div class="space-y-2">
              <Label>Kişi Başı Kullanım Limiti</Label>
              <Input v-model.number="usageLimitPerUser" type="number" min="0" />
            </div>
            <div class="space-y-2">
              <Label>Toplam Kullanım Limiti</Label>
              <Input v-model.number="usageLimitTotal" type="number" min="0" placeholder="Sınırsız" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="flex justify-end gap-4">
      <Button type="button" variant="outline" @click="emit('cancel')">İptal</Button>
      <Button type="submit" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ coupon ? 'Güncelle' : 'Oluştur' }}
      </Button>
    </div>
  </form>
</template>
