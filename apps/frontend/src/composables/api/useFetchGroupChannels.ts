import type { IChannel } from '~/types'

export function useFetchGroupChannels(groupId: ComputedRef<number | null>) {
  return useAsyncData(
    () => asyncKeys.groupChannels(groupId.value ?? 0),
    () => {
      if (!groupId.value) {
        return Promise.resolve([])
      }

      const { $api } = useNuxtApp()
      return $api<IChannel[]>(`/api/groups/${groupId.value}/channels`)
    },
    { deep: true },
  )
}
