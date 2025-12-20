import type { IUser } from '~/types'
import type { IMessage } from '@shared/types'

export function useFetchPersonalMessages(receiverId: ComputedRef<IUser['id'] | null>) {
  return useAsyncData(
    () => asyncKeys.messages(receiverId.value ?? 0),
    () => {
      if (!receiverId.value) {
        return Promise.resolve([])
      }

      const { $api } = useNuxtApp()
      return $api<IMessage[]>(`/api/messages/${receiverId.value}`)
    },
  )
}
