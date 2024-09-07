import type { IContact, IUser } from '@shared/types/client'

export interface ContactSliceType {
  /** List of all contacts of the authorized user, grouped by the first letter of the contact-aliases. */
  contacts: Record<string, IContact[]>

  /** Initialize the contacts map. */
  initContactStore: () => Promise<void>

  insertContact: (userToAdd: IUser, alias: IContact['alias']) => Promise<IContact>

  updateContactAlias: (contact: IContact, newAlias: IContact['alias']) => void

  deleteContact: (contact: IContact) => void
}