import { isNullOrUndefined } from '@arpansaha13/utils'
import _fetch from '~/utils/_fetch'
import type { IContact } from '@shared/types/client'
import type { Slice } from '~/store/types.store'
import type { ContactSliceType } from './types'

export const contactSlice: Slice<ContactSliceType> = set => ({
  contacts: {},

  async initContactStore() {
    const res: Record<string, IContact[]> = await _fetch('contacts')
    set({ contacts: res })
  },

  async insertContact(userToAdd, alias) {
    const newContact = await _fetch(`/contacts`, {
      method: 'POST',
      body: { userIdToAdd: userToAdd.id, alias },
    })

    set(state => {
      const firstLetter = alias.charAt(0).toUpperCase()

      if (isNullOrUndefined(state.contacts[firstLetter])) {
        state.contacts[firstLetter] = [newContact]
      } else {
        state.contacts[firstLetter].push(newContact)
        state.contacts[firstLetter].sort(sortCompareFn)
      }
    })

    return newContact
  },

  updateContactAlias(contact, newAlias) {
    set(state => {
      const oldFirstLetter = contact.alias.charAt(0).toUpperCase()
      const newFirstLetter = newAlias.charAt(0).toUpperCase()

      const contactsWithOldFirstLetter = state.contacts[oldFirstLetter]
      const idx = contactsWithOldFirstLetter.findIndex(c => c.contactId === contact.contactId)

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

  deleteContact(contact) {
    set(state => {
      const firstLetter = contact.alias.charAt(0).toUpperCase()
      const contactsWithFirstLetter = state.contacts[firstLetter]

      const idx = contactsWithFirstLetter.findIndex(c => c.contactId === contact.contactId)
      if (idx === -1) return

      contactsWithFirstLetter.splice(idx, 1)

      if (contactsWithFirstLetter.length === 0) {
        delete state.contacts[firstLetter]
      }

      _fetch(`/contacts/${contact.contactId}`, { method: 'DELETE' })
    })
  },
})

function sortCompareFn(a: Readonly<IContact>, b: Readonly<IContact>) {
  return a.alias < b.alias ? 1 : -1
}
