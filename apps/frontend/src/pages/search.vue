<template>
  <NuxtLayout name="window">
    <template #left>
      <UCard :ui="{ root: 'h-full flex flex-col', body: 'grow p-1.5 sm:p-1.5 overflow-y-auto' }">
        <!-- Search Input -->
        <template #header>
          <UInput
            v-model="searchQuery"
            placeholder="Search users..."
            icon="i-lucide-search"
            variant="subtle"
            class="w-full"
            data-testid="search-input"
          />
        </template>

        <!-- Search Results -->
        <div v-if="isSearching" class="flex items-center justify-center p-8">
          <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        </div>
        <div v-else-if="searchQuery && searchResults.length === 0" class="flex items-center justify-center p-8">
          <p class="text-sm text-gray-500">No users found</p>
        </div>
        <ul v-else-if="searchResults.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
          <li
            v-for="user in searchResults"
            :key="user.id"
            class="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            data-testid="search-result-item"
          >
            <ULink class="flex items-center gap-3" :to="{ query: { ...route.query, to: user.id } }">
              <UAvatar :src="user.dp || undefined" :alt="user.globalName" size="md" :ui="{ root: 'shadow-md' }" />
              <div class="flex flex-col">
                <p class="font-medium text-gray-900 dark:text-gray-100">
                  {{ user.globalName }}
                </p>
                <!-- <p class="text-xs text-gray-500 dark:text-gray-400">@{{ user.username }}</p> -->
                <p v-if="user.bio" class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {{ user.bio }}
                </p>
              </div>
            </ULink>

            <div v-if="!user.contact" class="shrink-0">
              <!-- Add to Contacts Modal -->
              <UModal v-model="isAddModalOpen" title="Add to Contacts">
                <UButton size="sm" label="Add" data-testid="add-contact-btn" @click="openAddModal(user)" />

                <template #body>
                  <div v-if="selectedUser" class="space-y-4">
                    <!-- User Info -->
                    <div class="flex flex-col items-center gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
                      <UAvatar :src="selectedUser.dp || undefined" :alt="selectedUser.globalName" size="lg" />
                      <div class="text-center">
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                          {{ selectedUser.globalName }}
                        </h3>
                        <!-- <p class="text-sm text-gray-500 dark:text-gray-400">@{{ selectedUser.username }}</p> -->
                        <p v-if="selectedUser.bio" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {{ selectedUser.bio }}
                        </p>
                      </div>
                    </div>

                    <!-- Alias Input -->
                    <UFormField label="Save as" hint="How you'll see this contact">
                      <UInput
                        v-model="aliasInput"
                        placeholder="Enter contact name"
                        class="w-full"
                        data-testid="add-contact-alias"
                        @keydown.enter="submitAdd"
                      />
                    </UFormField>
                  </div>
                </template>

                <template #footer>
                  <div class="flex justify-end gap-2">
                    <UButton variant="outline" label="Cancel" @click="isAddModalOpen = false" />
                    <UButton label="Add Contact" :loading="isAddingContact" data-testid="add-contact-submit" @click="submitAdd" />
                  </div>
                </template>
              </UModal>
            </div>
            <div v-else class="shrink-0">
              <UBadge color="success" label="Contact" data-testid="contact-badge" />
            </div>
          </li>
        </ul>
        <div v-else class="flex h-full items-center justify-center">
          <p class="text-sm text-gray-500">Search for users to add them as contacts</p>
        </div>
      </UCard>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { IUserSearchResult } from '~/types'

const toast = useToast()
const route = useRoute()

// Search state
const searchQuery = ref('')
const searchResults = ref<IUserSearchResult[]>([])
const isSearching = ref(false)

// Add contact modal state
const isAddModalOpen = ref(false)
const selectedUser = ref<IUserSearchResult | null>(null)
const aliasInput = ref('')
const isAddingContact = ref(false)

// Search users with debounced query
const debouncedSearchQuery = ref('')

const { data: allUsers, status: usersStatus } = useAsyncData(
  'search:users',
  () => $fetch('/api/users/search', { query: { q: debouncedSearchQuery.value || '' } }),
  {
    watch: [debouncedSearchQuery],
    lazy: true,
    server: false,
    immediate: false,
  },
)

// Debounced search handler
const debouncedSearch = useDebounceFn(() => {
  const trimmedQuery = searchQuery.value.trim()

  if (trimmedQuery) {
    isSearching.value = true
    debouncedSearchQuery.value = trimmedQuery
  } else {
    searchResults.value = []
    debouncedSearchQuery.value = ''
  }
}, 1000)

// Watch searchQuery and trigger debounced search
watch(searchQuery, () => {
  debouncedSearch()
})

// Update results when data arrives
watch([allUsers, usersStatus], () => {
  if (usersStatus.value === 'success' && allUsers.value) {
    searchResults.value = allUsers.value as IUserSearchResult[]
    isSearching.value = false
  }
})

function openAddModal(user: IUserSearchResult) {
  selectedUser.value = user
  aliasInput.value = user.globalName
  isAddModalOpen.value = true
}

async function submitAdd() {
  if (!selectedUser.value || !aliasInput.value.trim()) {
    toast.add({
      title: 'Error',
      description: 'Please enter a contact name',
      color: 'error',
    })
    return
  }

  isAddingContact.value = true
  try {
    await addContact({
      userIdToAdd: selectedUser.value.id,
      alias: aliasInput.value,
    })
    toast.add({
      title: 'Success',
      description: `${selectedUser.value.globalName} has been added to your contacts`,
      color: 'success',
    })
    isAddModalOpen.value = false
    selectedUser.value = null
    aliasInput.value = ''
    // Refetch search results to update contact status
    await refreshNuxtData('search:users')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to add contact',
      color: 'error',
    })
  } finally {
    isAddingContact.value = false
  }
}
</script>
