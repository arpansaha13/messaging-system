<template>
  <NuxtLayout name="window">
    <template #left>
      <UCard :ui="{ root: 'h-full flex flex-col', body: 'grow p-1.5 sm:p-1.5 overflow-y-auto' }">
        <template #header>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
        </template>

        <!-- Contacts List -->
        <div v-if="Object.keys(groupedContacts).length === 0" class="flex h-full items-center justify-center">
          <p class="text-sm text-gray-500">No contacts yet</p>
        </div>
        <div v-else>
          <div
            v-for="letter in Object.keys(groupedContacts).sort()"
            :key="letter"
            class="border-b border-gray-200 last:border-b-0 dark:border-gray-700"
          >
            <!-- Letter Header -->
            <div class="sticky top-0 z-10 bg-gray-50 px-4 py-2 dark:bg-gray-800/50">
              <h2 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                {{ letter }}
              </h2>
            </div>

            <!-- Contacts in Group -->
            <ul>
              <li
                v-for="contact in groupedContacts[letter]"
                :key="contact.id"
                class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <UAvatar :src="contact.dp || undefined" :alt="contact.alias" size="md" />
                  <div class="flex min-w-0 flex-col">
                    <p class="truncate font-medium text-gray-900 dark:text-gray-100">
                      {{ contact.alias }}
                    </p>
                    <p class="truncate text-xs text-gray-500 dark:text-gray-400">@{{ contact.username }}</p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="ml-2 flex shrink-0 gap-2">
                  <UButton size="sm" variant="ghost" icon="i-lucide-edit-2" @click="openEditModal(contact)" />
                  <UButton
                    size="sm"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    color="error"
                    @click="openDeleteModal(contact)"
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Edit Alias Modal -->
        <UModal v-model="isEditModalOpen" title="Edit Contact Name">
          <template v-if="selectedContact">
            <div class="space-y-4">
              <!-- Contact Info -->
              <div class="flex flex-col items-center gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
                <UAvatar :src="selectedContact.dp || undefined" :alt="selectedContact.alias" size="lg" />
                <div class="text-center">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                    {{ selectedContact.globalName }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">@{{ selectedContact.username }}</p>
                </div>
              </div>

              <!-- Alias Input -->
              <UFormField label="Contact Name">
                <UInput v-model="editAliasInput" placeholder="Enter contact name" @keydown.enter="submitEdit" />
              </UFormField>
            </div>
          </template>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton variant="outline" label="Cancel" @click="isEditModalOpen = false" />
              <UButton label="Save Changes" :loading="isEditingContact" @click="submitEdit" />
            </div>
          </template>
        </UModal>

        <!-- Delete Confirmation Modal -->
        <UModal v-model="isDeleteModalOpen" title="Delete Contact">
          <template v-if="selectedContact">
            <div class="space-y-4">
              <!-- Contact Info -->
              <div class="flex flex-col items-center gap-4 pb-4">
                <UAvatar :src="selectedContact.dp || undefined" :alt="selectedContact.alias" size="lg" />
                <div class="text-center">
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                    {{ selectedContact.globalName }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ selectedContact.alias }}
                  </p>
                </div>
              </div>

              <!-- Confirmation Message -->
              <p class="text-center text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this contact? This action cannot be undone.
              </p>
            </div>
          </template>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton variant="outline" label="Cancel" @click="isDeleteModalOpen = false" />
              <UButton color="error" label="Delete" :loading="isDeletingContact" @click="submitDelete" />
            </div>
          </template>
        </UModal>
      </UCard>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { deleteContact, patchContactAlias } from '~/services/contacts'
import type { IContact } from '~/types'

const toast = useToast()
const { data: contacts } = await useFetchContacts()

// Edit modal state
const isEditModalOpen = ref(false)
const selectedContact = ref<IContact | null>(null)
const editAliasInput = ref('')
const isEditingContact = ref(false)

// Delete modal state
const isDeleteModalOpen = ref(false)
const isDeletingContact = ref(false)

// Group contacts by first letter
const groupedContacts = computed(() => {
  const data = contacts.value || {}
  return data
})

function openEditModal(contact: IContact) {
  selectedContact.value = contact
  editAliasInput.value = contact.alias
  isEditModalOpen.value = true
}

async function submitEdit() {
  if (!selectedContact.value || !editAliasInput.value.trim()) {
    toast.add({
      title: 'Error',
      description: 'Please enter a contact name',
      color: 'error',
    })
    return
  }

  if (editAliasInput.value === selectedContact.value.alias) {
    isEditModalOpen.value = false
    return
  }

  isEditingContact.value = true
  try {
    await patchContactAlias(selectedContact.value.id, editAliasInput.value)
    toast.add({
      title: 'Success',
      description: 'Contact name updated',
      color: 'success',
    })
    isEditModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update contact name',
      color: 'error',
    })
  } finally {
    isEditingContact.value = false
  }
}

function openDeleteModal(contact: IContact) {
  selectedContact.value = contact
  isDeleteModalOpen.value = true
}

async function submitDelete() {
  if (!selectedContact.value) return

  isDeletingContact.value = true
  try {
    await deleteContact(selectedContact.value.id)
    toast.add({
      title: 'Success',
      description: 'Contact deleted',
      color: 'success',
    })
    isDeleteModalOpen.value = false
    selectedContact.value = null
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete contact',
      color: 'error',
    })
  } finally {
    isDeletingContact.value = false
  }
}
</script>
