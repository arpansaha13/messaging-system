<template>
  <NuxtLayout name="window">
    <template #left>
      <UCard v-if="contacts" :ui="{ root: 'h-full flex flex-col', body: 'grow p-0 sm:p-0 overflow-y-auto' }">
        <template #header>
          <h1 class="text-xl font-bold">Contacts</h1>
        </template>

        <!-- Contacts List -->
        <div v-if="Object.keys(contacts).length === 0" class="flex h-full items-center justify-center">
          <p class="text-sm text-gray-500">No contacts yet</p>
        </div>
        <template v-else>
          <div v-for="letter in Object.keys(contacts)" :key="letter">
            <!-- Letter Header -->
            <div class="sticky top-0 z-10 bg-gray-50 px-4 py-2 shadow-sm dark:bg-gray-800/50">
              <h2 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                {{ letter }}
              </h2>
            </div>

            <!-- Contacts in Group -->
            <ul class="p-1.5">
              <li v-for="contact in contacts[letter]" :key="contact.id">
                <NuxtLink
                  :to="{ query: { ...route.query, to: contact.userId } }"
                  class="group flex items-center justify-between p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <UAvatar :src="contact.dp || undefined" :alt="contact.alias" size="md" class="shadow-md" />
                    <div class="flex min-w-0 flex-col">
                      <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ contact.alias }}
                      </p>
                      <p class="truncate text-xs text-gray-500 dark:text-gray-400">@{{ contact.username }}</p>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div
                    class="invisible ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
                  >
                    <UButton
                      size="sm"
                      variant="ghost"
                      icon="i-lucide-edit-2"
                      @click.stop.prevent="handleEditContact(contact)"
                    />
                    <UButton
                      size="sm"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      color="error"
                      @click.stop.prevent="handleDeleteContact(contact)"
                    />
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </template>
      </UCard>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import EditContactModal from '~/components/modal/EditContact.vue'
import DeleteContactModal from '~/components/modal/DeleteContact.vue'
import type { IContact } from '~/types'

const route = useRoute()
const toast = useToast()

const { data: contacts } = await useFetchContacts()

const overlay = useOverlay()
const editContactModal = overlay.create(EditContactModal)
const deleteContactModal = overlay.create(DeleteContactModal)

async function handleEditContact(contact: IContact) {
  const instance = editContactModal.open({ contact })
  const result = await instance.result

  if (result.status === ModalStatus.CANCEL) return

  if (result.status === ModalStatus.SUCCESS) {
    toast.add({
      title: 'Contact name updated',
      color: 'success',
    })
    maybeClearActiveChat(contact.userId)
  } else {
    toast.add({
      title: 'Failed to update contact',
      color: 'error',
    })
  }
}

async function handleDeleteContact(contact: IContact) {
  const instance = deleteContactModal.open({ contact })
  const result = await instance.result

  if (result.status === ModalStatus.CANCEL) return

  if (result.status === ModalStatus.SUCCESS) {
    toast.add({
      title: 'Contact deleted',
      color: 'success',
    })
  } else {
    toast.add({
      title: 'Failed to delete contact',
      color: 'error',
    })
  }
}
</script>
