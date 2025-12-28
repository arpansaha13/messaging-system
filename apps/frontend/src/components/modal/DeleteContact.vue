<template>
  <UModal title="Delete Contact">
    <template v-if="contact" #body>
      <div class="space-y-4">
        <!-- Contact Info -->
        <div class="flex flex-col items-center gap-2">
          <UAvatar :src="contact.dp || undefined" :alt="contact.alias" size="3xl" />
          <div class="text-center">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">
              {{ contact.globalName }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ contact.alias }}
            </p>
          </div>
        </div>

        <!-- Confirmation Message -->
        <p class="text-center text-sm text-balance text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this contact? This action cannot be undone.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full gap-2">
        <UButton block variant="outline" color="neutral" label="Cancel" @click="cancel" />
        <UButton block label="Delete" color="error" :loading="loading" @click="handleDeleteContact" />
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { IContact } from '~/types'

const props = defineProps<{
  contact: IContact
}>()

const emit = defineEmits<{
  close: [{ status: ModalStatus; error?: Error }]
}>()

const loading = ref(false)

function cancel() {
  emit('close', { status: ModalStatus.CANCEL })
}

async function handleDeleteContact() {
  loading.value = true

  try {
    await deleteContact(props.contact.id)
    emit('close', { status: ModalStatus.SUCCESS })
  } catch (error: any) {
    emit('close', { status: ModalStatus.FAILED, error })
  } finally {
    loading.value = false
  }
}
</script>
