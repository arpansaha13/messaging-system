<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <div v-if="verificationStatus === 'verifying'" class="space-y-6 text-center">
        <h2 class="text-2xl font-semibold">Verify your account</h2>
        <p class="text-muted">Enter the OTP sent to your email to verify your account.</p>
        <UAuthForm
          ref="authForm"
          :schema="verificationSchema"
          :fields="verificationFields"
          :loading="isLoading"
          :submit="{ label: 'Verify' }"
          @submit="onVerify"
        />
      </div>
      <div v-else-if="verificationStatus === 'verified'" class="space-y-4 text-center">
        <UIcon name="i-lucide-check-circle" class="text-success mx-auto size-12" />
        <h2 class="text-2xl font-semibold">Verification successful!</h2>
        <p class="text-muted">Your account has been verified. You can now login.</p>
        <UButton to="/auth/login" class="w-full">Go to login</UButton>
      </div>
      <div v-else-if="verificationStatus === 'expired'" class="space-y-4 text-center">
        <UIcon name="i-lucide-alert-circle" class="text-error mx-auto size-12" />
        <h2 class="text-2xl font-semibold">Link Expired</h2>
        <p class="text-muted">The verification link has expired. Please request a new one.</p>
        <UButton to="/auth/login" class="w-full">Back to login</UButton>
      </div>
      <div v-else-if="verificationStatus === 'error'" class="space-y-4 text-center">
        <UIcon name="i-lucide-x-circle" class="text-error mx-auto size-12" />
        <h2 class="text-2xl font-semibold">Verification failed</h2>
        <p class="text-muted">{{ errorMessage }}</p>
        <UButton to="/auth/login" class="w-full">Back to login</UButton>
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
})

type VerificationStatus = 'verifying' | 'verified' | 'expired' | 'error'

const route = useRoute()
const toast = useToast()

const isLoading = ref(false)
const verificationStatus = ref<VerificationStatus>('verifying')
const errorMessage = ref('')

const verificationSchema = z.object({
  code: z.string().min(1, 'OTP is required'),
})

type VerificationSchema = z.output<typeof verificationSchema>

const verificationFields = [
  {
    name: 'code',
    type: 'text',
    label: 'OTP',
    placeholder: 'Enter the OTP',
    required: true,
    autofocus: true,
  },
]

async function onVerify(event: FormSubmitEvent<VerificationSchema>) {
  isLoading.value = true
  try {
    await verifySignup({
      hash: route.params.hash as string,
      code: event.data.code,
    })
    verificationStatus.value = 'verified'
    toast.add({
      title: 'Verification successful',
      description: 'Your account has been verified.',
      color: 'success',
    })
  } catch (error: any) {
    const message = error.data.message || 'Verification failed'
    if (message.includes('expired')) {
      verificationStatus.value = 'expired'
    } else {
      verificationStatus.value = 'error'
      errorMessage.value = message
    }
    toast.add({
      title: 'Verification failed',
      description: message,
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>
