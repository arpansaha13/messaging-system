<template>
  <NuxtLayout name="settings">
    <UCard variant="outline" :ui="{ root: 'h-full flex flex-col', body: 'grow' }">
      <template #header>
        <h1 class="text-xl font-bold">Personal Information</h1>
      </template>

      <div>
        <UAvatar :src="authUser?.dp || undefined" :alt="authUser?.globalName" size="3xl" />
      </div>

      <UForm :schema="schema" :state="formState" class="mt-4 space-y-4" @submit="onSubmit">
        <!-- Global Name Field -->
        <UFormField label="Full Name" name="globalName">
          <UInput
            v-model="formState.globalName"
            placeholder="Enter your full name"
            icon="i-heroicons-user"
            class="w-64"
          />
        </UFormField>

        <!-- Bio Field -->
        <UFormField label="Bio" name="bio">
          <UTextarea v-model="formState.bio" placeholder="Tell us about yourself" :rows="4" class="w-full" />
        </UFormField>

        <!-- Submit Buttons -->
        <div class="flex gap-3 pt-4">
          <UButton type="submit" :loading="savePending"> Save Changes </UButton>
          <UButton color="neutral" variant="outline" @click="resetForm"> Cancel </UButton>
        </div>

        <!-- Success Message -->
        <transition name="fade" mode="out-in">
          <UAlert
            v-if="saveSuccess"
            key="success"
            icon="i-heroicons-check-circle"
            title="Success"
            description="Your profile has been updated successfully."
            :closable="true"
            @close="saveSuccess = false"
          />
        </transition>
      </UForm>
    </UCard>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { z } from 'zod'

const toast = useToast()
const { data: authUser } = await useFetchAuthUser()

// Form schema validation
const schema = z.object({
  globalName: z.string().min(1, 'Full name is required').max(255),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().or(z.literal('')),
})

type FormState = z.input<typeof schema>

const formState = reactive<FormState>({
  globalName: authUser.value?.globalName || '',
  bio: authUser.value?.bio || '',
})

const savePending = ref(false)
const saveSuccess = ref(false)

// Reset form to current values
function resetForm() {
  if (authUser.value) {
    formState.globalName = authUser.value.globalName
    formState.bio = authUser.value.bio || ''
  }
}

// Handle form submission
async function onSubmit() {
  savePending.value = true
  try {
    await patchAuthUser({
      globalName: formState.globalName,
      bio: formState.bio || undefined,
    })

    toast.add({
      title: 'Your profile has been updated successfully.',
      color: 'success',
    })
  } catch {
    toast.add({
      title: 'Failed to update profile',
      color: 'error',
    })
  } finally {
    savePending.value = false
  }
}

watch(authUser, newAuthUser => {
  if (newAuthUser) {
    formState.globalName = newAuthUser.globalName
    formState.bio = newAuthUser.bio || ''
  }
})
</script>
