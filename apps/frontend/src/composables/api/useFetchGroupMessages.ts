import type { IGroupMessage } from '@shared/types'
import type { IChannel } from '~/types'

export function useFetchGroupMessages(channelId: ComputedRef<IChannel['id'] | null>) {
  return useAsyncData(
    () => asyncKeys.groupMessages(channelId.value ?? 0),
    () => {
      if (!channelId.value) {
        return Promise.resolve([])
      }

      const { $api } = useNuxtApp()
      return $api<IGroupMessage[]>(`/api/messages/channel/${channelId.value}`)
    },
  )
}
