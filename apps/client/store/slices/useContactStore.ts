import _fetch from '~/utils/_fetch'
import type { StateCreator } from 'zustand'
import type { IContact } from '@pkg/types'

export interface ContactStoreType {
  /** List of all contacts of the authorized user, grouped by the first letter of the contact-aliases. */
  contacts: Record<string, IContact[]>

  /** Initialize the contacts map. */
  initContactStore: () => Promise<void>
}

export const useContactStore: StateCreator<ContactStoreType, [], [], ContactStoreType> = set => ({
  contacts: {},
  async initContactStore() {
    const res: Record<string, IContact[]> = await _fetch('contacts')
    set({ contacts: res })
  },
})
