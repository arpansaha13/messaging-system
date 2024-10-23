'use client'

import { useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { Input } from '~/components/ui'
import Avatar from '~common/Avatar'
import SearchBar from '~common/SearchBar'
import StackedListItem from '~common/StackedListItem'
import FormModal from '~/components/common/FormModal'
import ConfirmModal from '~/components/common/ConfirmModal'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  setActiveChat,
  upsertChatListItemContact,
  upsertActiveChatContact,
  deleteChatListItemContact,
  deleteActiveChatContact,
} from '~/store/features/chat-list/chat-list.slice'
import { selectContacts, updateContactAlias, deleteContact } from '~/store/features/contacts/contact.slice'
import { _getContacts } from '~/utils/api'
import getFormData from '~/utils/getFormData'
import type { IContact, IContextMenuItem } from '@shared/types/client'

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
  const dispatch = useAppDispatch()

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
      _getContacts(value).then(setSearchResults)
    },
    1000,
    [value],
  )

  function handleClick(contact: IContact) {
    dispatch(
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
      }),
    )
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
  const contacts = useAppSelector(selectContacts)

  return Object.keys(contacts).map(letter => (
    <div key={letter} className="relative">
      {/* Size of image = h-12 w-12 */}
      <div className="dark:text-brand-500 mx-3 my-2 flex h-12 w-12 items-center justify-center font-medium text-gray-500">
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

  const dispatch = useAppDispatch()

  async function editContactAlias(e: React.FormEvent<HTMLFormElement>) {
    const formData = getFormData(e.currentTarget)

    if (contact!.alias === formData.new_alias) {
      setOpen(false)
      return
    }

    const newContact = {
      contactId: contact!.contactId,
      alias: formData.new_alias as string,
    }

    await dispatch(updateContactAlias({ contact: contact!, newAlias: formData.new_alias as string }))
    dispatch(upsertChatListItemContact({ receiverId: contact!.userId, newContact }))
    dispatch(upsertActiveChatContact({ receiverId: contact!.userId, newContact }))

    setOpen(false)
  }

  return (
    <FormModal
      open={open}
      setOpen={setOpen}
      action={editContactAlias}
      heading="Edit contact alias"
      submitButtonText="Save new alias"
    >
      <>
        <div className="mx-auto flex justify-center text-center">
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

        <Input
          label="By what name would you like to save this contact?"
          id="new_alias"
          name="new_alias"
          type="text"
          required
          defaultValue={contact?.alias}
          className="mt-4"
        />
      </>
    </FormModal>
  )
}

function DeleteContactModal(props: Readonly<DeleteContactModalProps>) {
  const { open, contact, setOpen } = props

  const dispatch = useAppDispatch()

  async function onSubmit() {
    await dispatch(deleteContact(contact!))
    dispatch(deleteChatListItemContact(contact!.userId))
    dispatch(deleteActiveChatContact(contact!.userId))
    setOpen(false)
  }

  return (
    <ConfirmModal open={open} setOpen={setOpen} heading="Delete contact" action={onSubmit} submitButtonText="Delete">
      <>
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
      </>
    </ConfirmModal>
  )
}
