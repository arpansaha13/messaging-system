import _fetch from './_fetch'
import type { IUserSearchResult } from '@shared/types/client'

export function _getUsers(query: string): Promise<IUserSearchResult[]> {
  return _fetch(`users/search?text=${query}`)
}
