import type { IAuthUser, IUser, IUserSearchResult } from '~/types'

export async function patchAuthUser(body: Partial<Pick<IAuthUser, 'bio' | 'globalName'>>) {
  const { $api } = useNuxtApp()
  await $api<IAuthUser>('/api/users/me', {
    method: 'PATCH',
    body,
  })
  await refreshNuxtData(asyncKeys.authUser)
}

export function fetchUser(userId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<IUser>(`/api/users/${userId}`)
}

export function searchUsers(query: string) {
  const { $api } = useNuxtApp()
  if (!query) {
    return Promise.resolve([] as IUserSearchResult[])
  }
  const encoded = new URLSearchParams({ text: query }).toString()
  return $api<IUserSearchResult[]>(`/api/users/search?${encoded}`)
}
