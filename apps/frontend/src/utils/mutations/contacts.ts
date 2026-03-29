import type { IContact, IUser } from '~/types'

export async function addContact(body: { userIdToAdd: IUser['id']; alias: IContact['alias'] }) {
  const { $api } = useNuxtApp()
  await $api<IContact>('/api/contacts', {
    method: 'POST',
    body: { userIdToAdd: body.userIdToAdd, alias: body.alias },
  })
}

/**
 * No optimistic updates. `DeleteContactModal` shows a loader during deletion.
 */
export async function deleteContact(contactId: IContact['id']) {
  const { $api } = useNuxtApp()
  await $api<undefined>(`/api/contacts/${contactId}`, {
    method: 'DELETE',
  })
  await refreshNuxtData(asyncKeys.contacts)
}

/**
 * No optimistic updates. `EditContactModal` shows a loader during update.
 */
export async function patchContactAlias(contactId: IContact['id'], newAlias: IContact['alias']) {
  const { $api } = useNuxtApp()
  await $api<undefined>(`/api/contacts/${contactId}`, {
    method: 'PATCH',
    body: { new_alias: newAlias },
  })
  await refreshNuxtData(asyncKeys.contacts)
}

export function searchContacts(query: string) {
  if (!query) {
    return Promise.resolve(null)
  }

  const { $api } = useNuxtApp()
  return $api<IContact[] | null>(`/api/contacts?search=${encodeURIComponent(query)}`)
}
