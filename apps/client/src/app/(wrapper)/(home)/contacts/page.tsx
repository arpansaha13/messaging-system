'use client'

import { useState } from 'react'
import { useDebounce } from 'react-use'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { Input } from '~/components/ui'
import { Avatar, ConfirmModal, SearchBar, FormModal, StackedListItem, StackedListItemLink } from '~/components/common'
import { useAppDispatch } from '~/store/hooks'
import { upsertChatListItemContact, deleteChatListItemContact } from '~/store/features/chat-list/chat-list.slice'
import {
  useGetContactsQuery,
  useDeleteContactMutation,
  useLazySearchContactsQuery,
  usePatchContactAliasMutation,
} from '~/store/features/contacts/contact.api.slice'
import { invalidateTags as invalidateUsersApiTags } from '~/store/features/users/users.api.slice'
import { USER_API_TAG } from '~/store/features/constants'
import getFormData from '~/utils/getFormData'
import type { IContact, IContextMenuItem } from '@shared/types/client'

interface ContactsProps {
  menuItems: IContextMenuItem[]
}

interface SearchResultsProps {
  results: IContact[]
  menuItems: IContextMenuItem[]
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
  const [value, setValue] = useState('')
  const [editAliasModalOpen, setEditAliasModalOpen] = useState(false)
  const [deleteContactModalOpen, setDeleteContactModalOpen] = useState(false)
  const [modalPayload, setModalPayload] = useState<IContact | null>(null)
  const [triggerSearch, { data: searchResults }] = useLazySearchContactsQuery()

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
      triggerSearch(value)
    },
    1000,
    [value],
  )

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
        <Contacts menuItems={menuItems} />
      ) : (
        <SearchResults results={searchResults} menuItems={menuItems} />
      )}

      <EditAliasModal open={editAliasModalOpen} contact={modalPayload} setOpen={setEditAliasModalOpen} />

      <DeleteContactModal open={deleteContactModalOpen} contact={modalPayload} setOpen={setDeleteContactModalOpen} />
    </div>
  )
}

function Contacts({ menuItems }: Readonly<ContactsProps>) {
  const { data: contacts, isSuccess } = useGetContactsQuery()

  if (!isSuccess) {
    return null
  }

  return Object.keys(contacts).map(letter => (
    <div key={letter} className="relative">
      {/* Size of image = h-12 w-12 */}
      <div className="dark:text-brand-500 mx-3 my-2 flex h-12 w-12 items-center justify-center font-medium text-gray-500">
        <h3>{letter}</h3>
      </div>

      <ul className="space-y-1">
        {contacts[letter].map(contact => (
          <StackedListItem key={contact.id} menuItems={menuItems} payload={contact}>
            <StackedListItemLink
              href={{ query: { to: contact.userId } }}
              image={contact.dp}
              title={contact.alias}
              subtitle={`${contact.globalName} • @${contact.username}`}
              text={contact.bio}
            />
          </StackedListItem>
        ))}
      </ul>
    </div>
  ))
}

function SearchResults({ results, menuItems }: Readonly<SearchResultsProps>) {
  return (
    <ul className="space-y-1 py-3">
      {results.map(contact => (
        <StackedListItem key={contact.id} menuItems={menuItems} payload={contact}>
          <StackedListItemLink
            href={{ query: { to: contact.userId } }}
            image={contact.dp}
            title={contact.alias}
            subtitle={`${contact.globalName} • @${contact.username}`}
            text={contact.bio}
          />
        </StackedListItem>
      ))}
    </ul>
  )
}

function EditAliasModal(props: Readonly<EditAliasModalProps>) {
  const { open, contact, setOpen } = props

  const dispatch = useAppDispatch()
  const [patchContactAlias] = usePatchContactAliasMutation()

  async function editContactAlias(e: React.FormEvent<HTMLFormElement>) {
    const formData = getFormData(e.currentTarget)

    if (contact!.alias === formData.new_alias) {
      setOpen(false)
      return
    }

    const newContact = {
      id: contact!.id,
      alias: formData.new_alias as string,
    }

    await patchContactAlias({ contactId: contact!.id, newAlias: formData.new_alias as string })
    dispatch(upsertChatListItemContact({ receiverId: contact!.userId, newContact }))
    dispatch(invalidateUsersApiTags([{ type: USER_API_TAG, id: contact!.userId }]))

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
          <Avatar src={contact?.dp} alt={`display picture of ${contact?.globalName}`} size={6} />
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
  const [deleteContact] = useDeleteContactMutation()

  async function onSubmit() {
    await deleteContact(contact!.id)
    dispatch(deleteChatListItemContact(contact!.userId))
    dispatch(invalidateUsersApiTags([{ type: USER_API_TAG, id: contact!.userId }]))
    setOpen(false)
  }

  return (
    <ConfirmModal open={open} setOpen={setOpen} heading="Delete contact" action={onSubmit} submitButtonText="Delete">
      <>
        <div className="mx-auto mt-4 flex justify-center text-center">
          <Avatar src={contact?.dp} alt={`display picture of ${contact?.globalName}`} size={6} />
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
