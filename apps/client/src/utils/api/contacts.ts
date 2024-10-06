import { isNullOrUndefined } from '@arpansaha13/utils'
import _fetch from './_fetch'
import type { IContact } from '@shared/types/client'

interface IPostContactsBody {
  userIdToAdd: number
  alias: string
}

interface IPatchContactsBody {
  new_alias: string
}

export function _getContacts(query: string): Promise<IContact[]>
export function _getContacts(query?: undefined): Promise<Record<string, IContact[]>>

export function _getContacts(query?: string) {
  if (isNullOrUndefined(query)) {
    return _fetch('contacts') as Promise<Record<string, IContact[]>>
  }
  return _fetch(`contacts?search=${query}`) as Promise<IContact[]>
}

export function _postContacts(body: IPostContactsBody): Promise<IContact> {
  return _fetch('contacts', { method: 'POST', body })
}

export function _patchContacts(contactId: IContact['contactId'], body: IPatchContactsBody): Promise<void> {
  return _fetch(`contacts/${contactId}`, { method: 'PATCH', body })
}

export function _deleteContacts(contactId: IContact['contactId']): Promise<void> {
  return _fetch(`contacts/${contactId}`, { method: 'DELETE' })
}
