import type { IUser } from '~/types'

export function useFetchUser(userId: ComputedRef<number | null>) {
  return useAsyncData(
    () => asyncKeys.user(userId.value ?? 0),
    () => {
      if (!userId.value) {
        return Promise.resolve(null)
      }

      const { $api } = useNuxtApp()
      return $api<IUser>(`/api/users/${userId.value}`)
    },
  )
}
