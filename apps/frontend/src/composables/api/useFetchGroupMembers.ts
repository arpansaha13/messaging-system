import type { IUserGroup } from '~/types'

export function useFetchGroupMembers(groupId: Ref<number> | ComputedRef<number> | number) {
  return useAsyncData(
    () => asyncKeys.groupMembers(unref(groupId)),
    () => {
      const { $api } = useNuxtApp()
      return $api<IUserGroup[]>(`/api/groups/${unref(groupId)}/members`)
    },
  )
}
