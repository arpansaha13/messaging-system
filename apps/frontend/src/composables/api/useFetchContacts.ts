import type { IContact } from '~/types'

export function useFetchContacts() {
  return useAsyncData(
    asyncKeys.contacts,
    async () => {
      const { $api } = useNuxtApp()
      return $api<IContact[]>('/api/contacts')
    },
    {
      transform: res => {
        return Object.groupBy(res, item => item.alias[0]!.toUpperCase())
      },
    },
  )
}
