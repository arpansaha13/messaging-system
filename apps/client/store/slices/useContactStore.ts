import _fetch from '~/utils/_fetch'
import type { StateCreator } from 'zustand'
import type { ContactResType, ContactType } from '@pkg/types'

export interface ContactStoreType {
  /** List of all contacts of the authorized user, grouped by the first letter of the contact-aliases. */
  contacts: { [letter: string]: ContactType[] }

  /** Initialize the contacts map. */
  initContactStore: () => Promise<void>
}

export const useContactStore: StateCreator<ContactStoreType, [], [], ContactStoreType> = set => ({
  contacts: {},
  async initContactStore() {
    const contactsRes: ContactResType[] = await _fetch('contacts')
    const newContacts: ContactStoreType['contacts'] = {}

    for (const contactResItem of contactsRes) {
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
    set({ contacts: newContacts })
  },
})
