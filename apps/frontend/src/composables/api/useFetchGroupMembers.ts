import type { IUserGroup } from '~/types'

export function useFetchGroupMembers(groupId: Ref<number> | ComputedRef<number> | number) {
  return useAsyncData(
    () => asyncKeys.groupMembers(unref(groupId)),
    () => {
      const id = unref(groupId)
      if (!id) {
        return Promise.resolve([])
      }
      const { $api } = useNuxtApp()
      return $api<IUserGroup[]>(`/api/groups/${id}/members`)
    },
  )
}
