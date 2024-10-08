import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { _deleteContacts, _getContacts, _patchContacts, _postContacts } from '~/utils/api'
import type { IContact, IUser } from '@shared/types/client'

interface IContactSlice {
  contacts: Record<string, IContact[]>
}

const initialState: IContactSlice = {
  contacts: {},
}

export const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    setContacts: (state, action: PayloadAction<{ [key: string]: IContact[] }>) => {
      state.contacts = action.payload
    },
    addContact: (state, action: PayloadAction<{ contact: IContact; alias: string }>) => {
      const { contact, alias } = action.payload
      const firstLetter = alias.charAt(0).toUpperCase()

      if (isNullOrUndefined(state.contacts[firstLetter])) {
        state.contacts[firstLetter] = [contact]
      } else {
        state.contacts[firstLetter].push(contact)
        state.contacts[firstLetter].sort(sortCompareFn)
      }
    },
    editContactAlias: (state, action: PayloadAction<{ contact: IContact; newAlias: IContact['alias'] }>) => {
      const { contact, newAlias } = action.payload
      const oldFirstLetter = contact.alias.charAt(0).toUpperCase()
      const newFirstLetter = newAlias.charAt(0).toUpperCase()

      const contactsWithOldFirstLetter = state.contacts[oldFirstLetter]
      const idx = contactsWithOldFirstLetter.findIndex(c => c.contactId === contact.contactId)

      if (idx === -1) return

      if (oldFirstLetter === newFirstLetter) {
        const contactToEdit = contactsWithOldFirstLetter[idx]
        contactToEdit.alias = newAlias
        contactsWithOldFirstLetter.sort(sortCompareFn)
        return
      }

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
    },
    removeContact: (state, action: PayloadAction<IContact>) => {
      const contact = action.payload
      const firstLetter = contact.alias.charAt(0).toUpperCase()
      const contactsWithFirstLetter = state.contacts[firstLetter]

      const idx = contactsWithFirstLetter.findIndex(c => c.contactId === contact.contactId)
      if (idx === -1) return

      contactsWithFirstLetter.splice(idx, 1)

      if (contactsWithFirstLetter.length === 0) {
        delete state.contacts[firstLetter]
      }
    },
  },
  selectors: {
    selectContacts: slice => slice.contacts,
  },
})

const sortCompareFn = (a: Readonly<IContact>, b: Readonly<IContact>) => (a.alias < b.alias ? 1 : -1)

export const { setContacts, addContact, editContactAlias, removeContact } = contactSlice.actions
export const { selectContacts } = contactSlice.selectors

export const initContactStore = createAsyncThunk('contacts/initContactStore', async (_, { dispatch }) => {
  const res = await _getContacts()
  dispatch(setContacts(res))
})

export const insertContact = createAsyncThunk(
  'contacts/insertContact',
  async ({ userToAdd, alias }: { userToAdd: IUser; alias: IContact['alias'] }, { dispatch }) => {
    const newContact = await _postContacts({ userIdToAdd: userToAdd.id, alias })
    dispatch(addContact({ contact: newContact, alias }))
    return newContact
  },
)

export const updateContactAlias = createAsyncThunk(
  'contacts/updateContactAlias',
  async ({ contact, newAlias }: { contact: IContact; newAlias: IContact['alias'] }, { dispatch }) => {
    await _patchContacts(contact.contactId, { new_alias: newAlias })
    dispatch(editContactAlias({ contact, newAlias }))
  },
)

export const deleteContact = createAsyncThunk('contacts/deleteContact', async (contact: IContact, { dispatch }) => {
  await _deleteContacts(contact.contactId)
  dispatch(removeContact(contact))
})
