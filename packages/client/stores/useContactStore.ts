import create from 'zustand'

import type { ContactType, UserType } from '../types'

type ContactResponseType = {
  [key: string]: {
    alias: string
    contact_user: UserType
  }[]
}

interface ContactStoreType {
  /** List of all contacts of the authorized user, grouped by the first letter of the contact-aliases. */
  contacts: {
    [key: string]: ContactType[]
  }

  /**
   * Initialize the contacts map.
   * @param initContacts
   */
  init: (initContacts: ContactResponseType) => void
}

export const useContactStore = create<ContactStoreType>()(set => ({
  contacts: {},
  init(initContacts: ContactResponseType) {
    set(() => {
      const newContacts: ContactStoreType['contacts'] = {}

      for (const letter of Object.keys(initContacts)) {
        newContacts[letter] = []

        for (const contact of initContacts[letter]) {
          newContacts[letter].push({
            userId: contact.contact_user.id,
            name: contact.alias,
            dp: contact.contact_user.dp,
            bio: contact.contact_user.bio,
          })
        }
      }

      return { contacts: newContacts }
    })
  },
}))
