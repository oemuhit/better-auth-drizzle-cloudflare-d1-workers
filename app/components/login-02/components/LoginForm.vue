<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { signIn } from '@/lib/auth-client'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const email = ref("")
const password = ref("")
const error = ref<string | null>(null)
const isLoading = ref(false)
const isGoogleLoading = ref(false)

const handleSubmit = async () => {
  error.value = null
  isLoading.value = true
  
  await signIn.email(
    {
      email: email.value,
      password: password.value,
      callbackURL: "/",
    },
    {
      onError(context) {
        error.value = context.error.message
        isLoading.value = false
      },
      onSuccess() {
        isLoading.value = false
      },
    }
  )
}

const handleGoogleSignIn = async () => {
  error.value = null
  isGoogleLoading.value = true
  
  await signIn.social({
    provider: 'google',
    callbackURL: '/',
  })
}
</script>

<template>
  <form :class="cn('flex flex-col gap-6', props.class)" @submit.prevent="handleSubmit">
    <FieldGroup>
      <div class="flex flex-col items-center gap-1 text-center">
        <h1 class="text-2xl font-bold">
          Hesabınıza Giriş Yapın
        </h1>
        <p class="text-muted-foreground text-sm text-balance">
          E-posta adresinizi girerek hesabınıza giriş yapın
        </p>
      </div>
      
      <!-- Error Alert -->
      <Alert v-if="error" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      
      <Field>
        <FieldLabel for="email">
          E-posta
        </FieldLabel>
        <Input 
          id="email" 
          type="email" 
          placeholder="ornek@email.com" 
          v-model="email"
          :disabled="isLoading"
          required 
        />
      </Field>
      <Field>
        <div class="flex items-center">
          <FieldLabel for="password">
            Şifre
          </FieldLabel>
          <NuxtLink
            to="/forget-password"
            class="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground"
          >
            Şifremi unuttum
          </NuxtLink>
        </div>
        <Input 
          id="password" 
          type="password" 
          placeholder="••••••••"
          v-model="password"
          :disabled="isLoading"
          required 
        />
      </Field>
      <Field>
        <Button type="submit" :disabled="isLoading || !email || !password">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
        </Button>
      </Field>
      <FieldSeparator>veya</FieldSeparator>
      <Field>
        <Button variant="outline" type="button" :disabled="isGoogleLoading" @click="handleGoogleSignIn">
          <Loader2 v-if="isGoogleLoading" class="mr-2 h-4 w-4 animate-spin" />
          <svg v-else class="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google ile Giriş Yap
        </Button>
        <FieldDescription class="text-center">
          Hesabınız yok mu?
          <NuxtLink to="/sign-up" class="underline text-primary">Kayıt Ol</NuxtLink>
        </FieldDescription>
      </Field>
    </FieldGroup>
  </form>
</template>
