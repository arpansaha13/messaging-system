import type { IContact } from '~/types'

export function useFetchContacts() {
  return useAsyncData(asyncKeys.contacts, () => {
    const { $api } = useNuxtApp()
    return $api<Record<string, IContact[]>>('/api/contacts')
  })
}
