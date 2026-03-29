<template>
  <UPageCard class="w-full max-w-md">
    <UAuthForm
      ref="authForm"
	  data-testid="signup-form"
      :schema="signupSchema"
      :fields="signupFields"
      :validate="validateSignup"
      title="Create Account"
      icon="i-lucide-user-plus"
      :loading="isLoading"
      @submit="onSignup"
    >
      <template #description>
        Already have an account? <ULink to="/auth/login" class="font-medium">Login</ULink>.
      </template>
    </UAuthForm>
  </UPageCard>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField, FormError } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
})

const router = useRouter()
const toast = useToast()
const isLoading = ref(false)

const signupSchema = z.object({
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  globalName: z.string().min(1, 'Name is required').max(20, 'Name must be at most 20 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(30, 'Password must be at most 30 characters'),
  confirmPassword: z
    .string()
    .min(8, 'Please confirm your password')
    .max(30, 'Confirm password must be at most 30 characters'),
})

type SignupSchema = z.output<typeof signupSchema>

const signupFields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
    autofocus: true,
  },
  {
    name: 'globalName',
    type: 'text',
    label: 'Name',
    placeholder: 'Enter your name',
    required: true,
    minlength: 1,
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    required: true,
    minlength: 8,
    maxlength: 30,
  },
  {
    name: 'confirmPassword',
    type: 'password',
    label: 'Confirm Password',
    placeholder: 'Confirm your password',
    required: true,
    minlength: 8,
    maxlength: 30,
  },
]

const authForm = useTemplateRef<any>('authForm')

function validateSignup(state: Partial<SignupSchema>): FormError<string>[] | Promise<FormError<string>[]> {
  const errors: FormError<string>[] = []

  if (state.password && state.confirmPassword && state.password !== state.confirmPassword) {
    errors.push({ name: 'confirmPassword', message: 'Passwords do not match' })
  }

  return errors
}

async function onSignup(event: FormSubmitEvent<SignupSchema>) {
  isLoading.value = true
  try {
    // Remove confirmPassword before sending to API
    const { ...signupData } = event.data
    const resp = await signup(signupData)
    toast.add({
      title: 'Account created!',
      description: 'Please verify your account using the link sent to your email.',
      color: 'success',
    })
    await router.push(`/auth/verification/${resp.otpHash}`)
  } catch (error: any) {
    const message = Array.isArray(error.data.message) ? error.data.message[0] : error.data.message
    toast.add({
      title: 'Sign up failed',
      description: message || 'An error occurred during sign up',
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>
