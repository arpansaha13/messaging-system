import create from 'zustand'

import type { ContactType } from '../types'

interface ContactStoreType {
  /** List of all contacts with whom the logged-in user chats, mapped with their respective userTags. */
  contacts: Map<string, ContactType>

  /**
   * Initialize the contacts map.
   * @param initContacts Array of contacts. This array will be stored in the state as a Map object.
   */
  init: (initContacts: ContactType[]) => void
}

export const useContactStore = create<ContactStoreType>()(
  (set) => ({
    contacts: new Map<string, ContactType>(),
    init(initContacts: ContactType[]) {
      set(() => {
        const newContactsMap = new Map<string, ContactType>()

        for (const user of initContacts) {
          newContactsMap.set(user.userTag, user)
        }

        return {contacts: newContactsMap}
      })
    },
  }),
)
