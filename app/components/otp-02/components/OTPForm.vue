<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2, CheckCircle2, Mail } from 'lucide-vue-next'

const props = defineProps<{
  class?: HTMLAttributes["class"]
  email?: string
}>()

const emit = defineEmits<{
  (e: 'verified'): void
  (e: 'resend'): void
}>()

const otpValue = ref("")
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const isLoading = ref(false)
const isResending = ref(false)

const handleVerify = async () => {
  if (otpValue.value.length !== 6) {
    error.value = "Lütfen 6 haneli kodu girin"
    return
  }
  
  error.value = null
  isLoading.value = true
  
  try {
    await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: {
        token: otpValue.value,
        email: props.email,
      }
    })
    success.value = "E-posta doğrulandı! Yönlendiriliyorsunuz..."
    emit('verified')
    setTimeout(() => {
      navigateTo('/sign-in')
    }, 2000)
  } catch (e: any) {
    error.value = e.data?.message || "Doğrulama başarısız. Lütfen kodu kontrol edin."
    isLoading.value = false
  }
}

const handleResend = async () => {
  error.value = null
  success.value = null
  isResending.value = true
  
  try {
    await $fetch('/api/auth/send-verification-email', {
      method: 'POST',
      body: {
        email: props.email,
      }
    })
    success.value = "Doğrulama kodu tekrar gönderildi!"
    emit('resend')
    setTimeout(() => {
      success.value = null
    }, 3000)
  } catch (e: any) {
    error.value = e.data?.message || "Kod gönderilemedi"
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <form @submit.prevent="handleVerify">
      <FieldGroup>
        <div class="flex flex-col items-center gap-1 text-center">
          <div class="mb-2 rounded-full bg-primary/10 p-3">
            <Mail class="h-8 w-8 text-primary" />
          </div>
          <h1 class="text-2xl font-bold">
            E-postanızı Doğrulayın
          </h1>
          <p class="text-muted-foreground text-sm text-balance">
            {{ email ? `${email} adresine` : 'E-posta adresinize' }} gönderilen 6 haneli kodu girin.
          </p>
        </div>
        
        <!-- Success Alert -->
        <Alert v-if="success" variant="default" class="border-green-500 bg-green-50 text-green-800">
          <CheckCircle2 class="h-4 w-4 text-green-600" />
          <AlertTitle>Başarılı</AlertTitle>
          <AlertDescription>{{ success }}</AlertDescription>
        </Alert>
        
        <!-- Error Alert -->
        <Alert v-if="error" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
        
        <Field>
          <FieldLabel for="otp" class="sr-only">
            Doğrulama kodu
          </FieldLabel>
          <InputOTP 
            id="otp" 
            :maxlength="6" 
            v-model="otpValue"
            :disabled="isLoading"
            required
          >
            <InputOTPGroup class="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
              <InputOTPSlot :index="0" />
              <InputOTPSlot :index="1" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup class="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
              <InputOTPSlot :index="2" />
              <InputOTPSlot :index="3" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup class="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
              <InputOTPSlot :index="4" />
              <InputOTPSlot :index="5" />
            </InputOTPGroup>
          </InputOTP>
          <FieldDescription class="text-center">
            E-postanıza gönderilen 6 haneli kodu girin.
          </FieldDescription>
        </Field>
        <Button type="submit" :disabled="isLoading || otpValue.length !== 6">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Doğrulanıyor...' : 'Doğrula' }}
        </Button>
        <FieldDescription class="text-center">
          Kodu almadınız mı? 
          <button 
            type="button" 
            class="underline text-primary hover:text-primary/80 disabled:opacity-50" 
            :disabled="isResending"
            @click="handleResend"
          >
            <Loader2 v-if="isResending" class="inline mr-1 h-3 w-3 animate-spin" />
            Tekrar Gönder
          </button>
        </FieldDescription>
      </FieldGroup>
    </form>
  </div>
</template>
