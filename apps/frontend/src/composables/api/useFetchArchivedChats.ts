import type { IChatListItem } from '~/types'

export function useFetchArchivedChats() {
  return useAsyncData(
    asyncKeys.chatListArchived,
    () => {
      const { $api } = useNuxtApp()
      return $api<IChatListItem[]>('/api/chats/archived')
    },
    { deep: true },
  )
}
