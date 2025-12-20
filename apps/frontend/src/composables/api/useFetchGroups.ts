import type { IGroup } from '~/types'

export function useFetchGroups() {
  return useAsyncData(asyncKeys.groups, () => {
    const { $api } = useNuxtApp()
    return $api<IGroup[]>('/api/groups')
  })
}
