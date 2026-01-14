<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        ref="authForm"
        :schema="loginSchema"
        :fields="loginFields"
        title="Login"
        icon="i-lucide-lock"
        :loading="isLoading"
        @submit="onLogin"
      >
        <template #description>
          Don't have an account? <ULink to="/auth/signup" class="font-medium">Sign up</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
})

const toast = useToast()
const isLoading = ref(false)

const loginSchema = z.object({
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginSchema = z.output<typeof loginSchema>

const loginFields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
    autofocus: true,
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    required: true,
  },
]

async function onLogin(e: FormSubmitEvent<LoginSchema>) {
  e.preventDefault()
  isLoading.value = true

  try {
    await login(e.data)
    toast.add({
      title: 'Login successful',
      description: 'You are now logged in.',
      color: 'success',
    })
    await navigateTo('/', { replace: true })
  } catch (err: any) {
    toast.add({
      title: 'Login failed',
      description: err.message || 'An error occurred during login',
      color: 'error',
    })
    if (err.status !== HttpStatus.UNAUTHORIZED) {
      throw err
    }
  } finally {
    isLoading.value = false
  }
}
</script>
