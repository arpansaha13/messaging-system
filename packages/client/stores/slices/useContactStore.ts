import type { StateCreator } from 'zustand'
import type { ContactResType, ContactType } from '../types/index.types'

export interface ContactStoreType {
  /** List of all contacts of the authorized user, grouped by the first letter of the contact-aliases. */
  contacts: { [letter: string]: ContactType[] }

  /** Initialize the contacts map. */
  initContactStore: (initContacts: ContactResType[]) => void
}

export const useContactStore: StateCreator<ContactStoreType, [], [], ContactStoreType> = set => ({
  contacts: {},
  initContactStore(initContacts) {
    set(() => {
      const newContacts: ContactStoreType['contacts'] = {}

      for (const contactResItem of initContacts) {
        const letter = contactResItem.alias[0]
        if (typeof newContacts[letter] === 'undefined') newContacts[letter] = []

        newContacts[letter].push({
          alias: contactResItem.alias,
          contactId: contactResItem.id,
          userId: contactResItem.userInContact.id,
          bio: contactResItem.userInContact.bio,
          dp: contactResItem.userInContact.dp,
          displayName: contactResItem.userInContact.displayName,
        })
      }

      return { contacts: newContacts }
    })
  },
})
