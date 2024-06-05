'use client'

import { useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { shallow } from 'zustand/shallow'
import { DialogTitle } from '@headlessui/react'
import { isNullOrUndefined } from '@arpansaha13/utils'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import Modal from '~common/Modal'
import Avatar from '~common/Avatar'
import SearchBar from '~common/SearchBar'
import StackedListItem from '~common/StackedListItem'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import getFormData from '~/utils/getFormData'
import type { IContact, IContextMenuItem } from '@pkg/types'

interface ContactsProps {
  menuItems: IContextMenuItem[]
  handleClick: (contact: IContact) => void
}

interface SearchResultsProps {
  results: IContact[]
  menuItems: IContextMenuItem[]
  handleClick: (contact: IContact) => void
}

interface EditAliasModalProps {
  open: boolean
  contact: IContact | null
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

interface DeleteContactModalProps {
  open: boolean
  contact: IContact | null
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Page() {
  const [setActiveChat] = useStore(state => [state.setActiveChat], shallow)

  const isFirstRun = useRef(true)
  const [value, setValue] = useState('')
  const [editAliasModalOpen, setEditAliasModalOpen] = useState(false)
  const [deleteContactModalOpen, setDeleteContactModalOpen] = useState(false)
  const [modalPayload, setModalPayload] = useState<IContact | null>(null)
  const [searchResults, setSearchResults] = useState<IContact[] | null>(null)

  const menuItems: IContextMenuItem[] = [
    {
      slot: 'Edit Alias',
      action: (_, payload: IContact) => {
        setEditAliasModalOpen(true)
        setModalPayload(payload)
      },
    },
    {
      slot: 'Delete Contact',
      action: (_, payload: IContact) => {
        setDeleteContactModalOpen(true)
        setModalPayload(payload)
      },
    },
  ]

  useDebounce(
    () => {
      if (isFirstRun.current) {
        isFirstRun.current = false
        return
      }
      if (value === '') {
        setSearchResults(null)
        return
      }
      _fetch(`contacts?search=${value}`).then(setSearchResults)
    },
    1000,
    [value],
  )

  function handleClick(contact: IContact) {
    setActiveChat({
      contact: {
        id: contact.contactId,
        alias: contact.alias,
      },
      receiver: {
        id: contact.userId,
        dp: contact.dp,
        bio: contact.bio,
        username: contact.username,
        globalName: contact.globalName,
      },
    })
  }

  return (
    <div className="py-2">
      <SearchBar
        id="search"
        name="search"
        placeholder="Search contacts"
        type="text"
        value={value}
        setValue={setValue}
      />

      {isNullOrUndefined(searchResults) ? (
        <Contacts menuItems={menuItems} handleClick={handleClick} />
      ) : (
        <SearchResults results={searchResults} menuItems={menuItems} handleClick={handleClick} />
      )}

      <EditAliasModal open={editAliasModalOpen} contact={modalPayload} setOpen={setEditAliasModalOpen} />

      <DeleteContactModal open={deleteContactModalOpen} contact={modalPayload} setOpen={setDeleteContactModalOpen} />
    </div>
  )
}

function Contacts({ menuItems, handleClick }: Readonly<ContactsProps>) {
  const contacts = useStore(state => state.contacts)

  return Object.keys(contacts).map(letter => (
    <div key={letter} className="relative">
      {/* Size of image = h-12 w-12 */}
      <div className="mx-3 my-2 flex h-12 w-12 items-center justify-center font-medium text-gray-500 dark:text-emerald-500">
        <h3>{letter}</h3>
      </div>

      <ul className="space-y-1">
        {contacts[letter].map(contact => (
          <StackedListItem
            key={contact.contactId}
            image={contact.dp}
            title={contact.alias}
            subtitle={`${contact.globalName} • @${contact.username}`}
            text={contact.bio}
            menuItems={menuItems}
            payload={contact}
            onClick={() => handleClick(contact)}
          />
        ))}
      </ul>
    </div>
  ))
}

function SearchResults({ results, menuItems, handleClick }: Readonly<SearchResultsProps>) {
  return (
    <ul className="space-y-1 py-3">
      {results.map(contact => (
        <StackedListItem
          key={contact.contactId}
          image={contact.dp}
          title={contact.alias}
          subtitle={`${contact.globalName} • @${contact.username}`}
          text={contact.bio}
          menuItems={menuItems}
          payload={contact}
          onClick={() => handleClick(contact)}
        />
      ))}
    </ul>
  )
}

function EditAliasModal(props: Readonly<EditAliasModalProps>) {
  const { open, contact, setOpen } = props

  const [updateContactAlias, upsertChatListItemContact, upsertActiveChatContact] = useStore(
    state => [state.updateContactAlias, state.upsertChatListItemContact, state.upsertActiveChatContact],
    shallow,
  )

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = getFormData(e.currentTarget)

    if (contact!.alias === formData.new_alias) {
      setOpen(false)
      return
    }

    const newContact = {
      contactId: contact!.contactId,
      alias: formData.new_alias as string,
    }

    updateContactAlias(contact!, formData.new_alias as string)
    upsertChatListItemContact(contact!.userId, newContact)
    upsertActiveChatContact(contact!.userId, newContact)

    setOpen(false)
  }

  return (
    <Modal open={open} setOpen={setOpen}>
      <div className="mt-3 sm:mt-5">
        <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Edit contact alias
        </DialogTitle>

        <div className="mx-auto mt-4 flex justify-center text-center">
          <Avatar src={contact?.dp} alt={`display picture of ${contact?.globalName}`} width={6} height={6} />
        </div>

        {contact && (
          <div className="mt-2">
            <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-300">{contact?.alias}</p>
          </div>
        )}

        <div className="mt-2">
          <p className="text-center text-sm text-gray-500 dark:text-gray-300">{contact?.bio}</p>
        </div>

        <form className="mt-4" onSubmit={onSubmit}>
          <BaseInput
            label="By what name would you like to save this contact?"
            id="new_alias"
            name="new_alias"
            type="text"
            required
            defaultValue={contact?.alias}
          />

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <BaseButton type="submit" className="sm:col-start-2">
              Save new alias
            </BaseButton>

            <BaseButton secondary className="mt-3 sm:col-start-1 sm:mt-0" onClick={() => setOpen(false)}>
              Cancel
            </BaseButton>
          </div>
        </form>
      </div>
    </Modal>
  )
}

function DeleteContactModal(props: Readonly<DeleteContactModalProps>) {
  const { open, contact, setOpen } = props

  const [deleteContact, deleteChatListItemContact, deleteActiveChatContact] = useStore(
    state => [state.deleteContact, state.deleteChatListItemContact, state.deleteActiveChatContact],
    shallow,
  )

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    deleteContact(contact!)
    deleteChatListItemContact(contact!.userId)
    deleteActiveChatContact(contact!.userId)

    setOpen(false)
  }

  return (
    <Modal open={open} setOpen={setOpen}>
      <div className="mt-3 sm:mt-5">
        <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Delete contact
        </DialogTitle>

        <div className="mx-auto mt-4 flex justify-center text-center">
          <Avatar src={contact?.dp} alt={`display picture of ${contact?.globalName}`} width={6} height={6} />
        </div>

        {contact && (
          <div className="mt-2">
            <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-300">{contact?.alias}</p>
          </div>
        )}

        <div className="mt-2">
          <p className="text-center text-sm text-gray-500 dark:text-gray-300">{contact?.bio}</p>
        </div>

        <p className="mt-2 text-center">Are you sure you want to delete this contact?</p>

        <form className="mt-4" onSubmit={onSubmit}>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2"
            >
              Delete
            </button>

            <BaseButton secondary className="mt-3 sm:col-start-1 sm:mt-0" onClick={() => setOpen(false)}>
              Cancel
            </BaseButton>
          </div>
        </form>
      </div>
    </Modal>
  )
}
