import { isNullOrUndefined } from '@arpansaha13/utils'
import _fetch from '~/utils/_fetch'
import type { IContact } from '@pkg/types'
import type { Slice } from '../types.store'

export interface ContactStoreType {
  /** List of all contacts of the authorized user, grouped by the first letter of the contact-aliases. */
  contacts: Record<string, IContact[]>

  /** Initialize the contacts map. */
  initContactStore: () => Promise<void>

  updateContactAlias: (contact: IContact, newAlias: IContact['alias']) => void
}

export const useContactStore: Slice<ContactStoreType> = set => ({
  contacts: {},

  async initContactStore() {
    const res: Record<string, IContact[]> = await _fetch('contacts')
    set({ contacts: res })
  },

  updateContactAlias(contact, newAlias) {
    set(state => {
      const oldFirstLetter = contact.alias.charAt(0).toUpperCase()
      const newFirstLetter = newAlias.charAt(0).toUpperCase()

      const contactsWithOldFirstLetter = state.contacts[oldFirstLetter]
      const idx = state.contacts[oldFirstLetter].findIndex(c => c.contactId === contact.contactId)

      if (idx === -1) return

      if (oldFirstLetter === newFirstLetter) {
        const contactToEdit = contactsWithOldFirstLetter[idx]
        contactToEdit.alias = newAlias
        contactsWithOldFirstLetter.sort(sortCompareFn)
      } else {
        const contactToEdit = contactsWithOldFirstLetter.splice(idx, 1)[0]
        contactToEdit.alias = newAlias

        if (contactsWithOldFirstLetter.length === 0) {
          delete state.contacts[oldFirstLetter]
        }

        if (isNullOrUndefined(state.contacts[newFirstLetter])) {
          state.contacts[newFirstLetter] = [contactToEdit]
        } else {
          state.contacts[newFirstLetter].push(contactToEdit)
          state.contacts[newFirstLetter].sort(sortCompareFn)
        }
      }

      _fetch(`/contacts/${contact.contactId}`, {
        method: 'PATCH',
        body: { new_alias: newAlias },
      })
    })
  },
})

function sortCompareFn(a: Readonly<IContact>, b: Readonly<IContact>) {
  return a.alias < b.alias ? 1 : -1
}
