<template>
  <UModal title="Edit Contact">
    <template #body>
      <div class="space-y-4">
        <UForm ref="editContactForm" :schema="editContactSchema" :state="formState" class="space-y-4" @submit="handleSubmit">
          <!-- Contact Info -->
          <div class="flex flex-col items-center gap-2 border-b border-gray-200 pb-4 dark:border-gray-700">
            <UAvatar :src="contact.dp || undefined" :alt="contact.alias" size="3xl" />
            <div class="text-center">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                {{ contact.alias }}
              </h3>
              <p class="text-sm ">
                <span>{{ contact.globalName }}</span>
                <!-- {{ ' ' }}
                <span class="text-gray-500 dark:text-gray-400">@{{ contact.username }}</span> -->
              </p>
            </div>
          </div>

          <!-- Alias Input -->
          <UFormField required name="alias" label="Contact Name">
            <UInput v-model="formState.alias" required placeholder="Enter contact name" class="w-full" />
          </UFormField>
        </Uform>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 w-full">
        <UButton block variant="outline" color="neutral" label="Cancel" @click="cancel" />
        <UButton block label="Save Changes" :loading="loading" @click="submit" />
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import z from 'zod';
import type { IContact } from '~/types';

const props = defineProps<{
  contact: IContact
}>()

const emit = defineEmits<{
  close: [{ status: ModalStatus, error?: Error }]
}>()

const editContactSchema = z.object({
  alias: z.string().min(1, 'Please provide a contact name'),
})

const loading = ref(false)
const formState = ref({ alias: '' })
const editContactFormRef = useTemplateRef('editContactForm')

function submit() {
  editContactFormRef.value?.submit()
}

function cancel() {
  emit('close', { status: ModalStatus.CANCEL })
}

async function handleSubmit() {
  if (props.contact.alias === formState.value.alias) {
    return cancel()
  }

  loading.value = true

  try {
    await patchContactAlias(props.contact.id, formState.value.alias)
    emit('close', { status: ModalStatus.SUCCESS })
  } catch (error: any) {
    emit('close', { status: ModalStatus.FAILED, error })
  } finally {
    loading.value = false
  }
}
</script>