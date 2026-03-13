import type { IChatListItem } from '~/types'

export function useFetchUnarchivedChats() {
  return useAsyncData(
    asyncKeys.chatListUnarchived,
    () => {
      const { $api } = useNuxtApp()
      return $api<IChatListItem[]>('/api/chats')
    },
    { deep: true },
  )
}
