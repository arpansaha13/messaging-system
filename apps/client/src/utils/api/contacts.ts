import _fetch from './_fetch'
import type { IContact } from '@shared/types/client'

export function _getContacts(query: string) {
  return _fetch(`contacts?search=${query}`) as Promise<IContact[]>
}
