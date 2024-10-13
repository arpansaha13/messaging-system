import _fetch from './_fetch'
import type { IAuthUser, IUserSearchResult } from '@shared/types/client'

export function _patchMe(body: Partial<Pick<IAuthUser, 'bio' | 'globalName'>>): Promise<IAuthUser> {
  return _fetch('users/me', { body, method: 'PATCH' })
}

export function _getUsers(query: string): Promise<IUserSearchResult[]> {
  return _fetch(`users/search?text=${query}`)
}
