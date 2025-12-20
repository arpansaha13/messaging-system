import type { IAuthUser } from '~/types'

export function useFetchAuthUser() {
  return useAsyncData(asyncKeys.authUser, () => {
    const { $api } = useNuxtApp()
    return $api<IAuthUser>('/api/users/me')
  })
}
