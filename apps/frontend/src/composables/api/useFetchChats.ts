import type { IChatsResponse } from '~/types'

export function useFetchChats() {
  return useAsyncData(
    asyncKeys.chatList,
    () => {
      const { $api } = useNuxtApp()
      return $api<IChatsResponse>('/api/chats')
    },
    { deep: true },
  )
}
