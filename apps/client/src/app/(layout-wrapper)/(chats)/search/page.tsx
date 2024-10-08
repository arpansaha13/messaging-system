'use client'

import { useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { DialogTitle } from '@headlessui/react'
import { isNullOrUndefined } from '@arpansaha13/utils'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import Modal from '~common/Modal'
import Avatar from '~common/Avatar'
import SearchBar from '~common/SearchBar'
import StackedListItem from '~common/StackedListItem'
import GlobalName from '~/components/GlobalName'
import { useAppDispatch } from '~/store/hooks'
import {
  setActiveChat,
  upsertActiveChatContact,
  upsertChatListItemContact,
} from '~/store/features/chat-list/chat-list.slice'
import { insertContact } from '~/store/features/contacts/contact.slice'
import { _getUsers } from '~/utils/api'
import getFormData from '~/utils/getFormData'
import type { IContact, IContextMenuItem, IUserSearchResult } from '@shared/types/client'

interface SearchResultsProps {
  results: IUserSearchResult[]
  menuItems: IContextMenuItem[]
  handleClick: (user: IUserSearchResult) => void
}

interface AddContactModalProps {
  open: boolean
  user: IUserSearchResult | null
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  updateSearchResults: (newContact: IContact) => void
}

export default function Page() {
  const dispatch = useAppDispatch()

  const isFirstRun = useRef(true)
  const [value, setValue] = useState('')
  const [searchResults, setSearchResults] = useState<IUserSearchResult[] | null>(null)
  const [addContactModalOpen, setAddContactModalOpen] = useState(false)
  const [modalPayload, setModalPayload] = useState<IUserSearchResult | null>(null)

  const menuItems: IContextMenuItem[] = [
    {
      slot: 'Add to Contacts',
      action: (_, payload) => {
        setAddContactModalOpen(true)
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
      _getUsers(value).then(setSearchResults)
    },
    1000,
    [value],
  )

  function handleClick(user: IUserSearchResult) {
    dispatch(
      setActiveChat({
        contact: user.contact ?? null,
        receiver: {
          id: user.id,
          dp: user.dp,
          bio: user.bio,
          username: user.username,
          globalName: user.globalName,
        },
      }),
    )
  }

  function updateSearchResults(newContact: IContact) {
    const item = searchResults!.find(u => u.id === newContact.userId)
    if (item) {
      item.contact = {
        id: newContact.contactId,
        alias: newContact.alias,
      }
    }
  }

  return (
    <div className="py-2">
      <SearchBar id="search" name="search" placeholder="Search" type="text" value={value} setValue={setValue} />

      {!isNullOrUndefined(searchResults) && (
        <SearchResults results={searchResults} menuItems={menuItems} handleClick={handleClick} />
      )}

      <AddContactModal
        open={addContactModalOpen}
        user={modalPayload}
        setOpen={setAddContactModalOpen}
        updateSearchResults={updateSearchResults}
      />
    </div>
  )
}

function SearchResults({ results, menuItems, handleClick }: Readonly<SearchResultsProps>) {
  return (
    <ul className="py-3">
      {results.map(user => (
        <StackedListItem
          key={user.id}
          image={user.dp}
          title={user.contact ? user.contact.alias : <GlobalName name={user.globalName} />}
          subtitle={user.contact ? `${user.globalName} • @${user.username}` : `@${user.username}`}
          text={user.bio}
          {...(isNullOrUndefined(user.contact) && { menuItems, payload: user })}
          onClick={() => handleClick(user)}
        />
      ))}
    </ul>
  )
}

function AddContactModal(props: Readonly<AddContactModalProps>) {
  const { open, user, setOpen, updateSearchResults } = props

  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = getFormData(e.currentTarget)

    const newContact = await dispatch(insertContact({ userToAdd: user!, alias: formData.new_alias as string })).unwrap()
    dispatch(upsertChatListItemContact({ receiverId: user!.id, newContact }))
    dispatch(upsertActiveChatContact({ receiverId: user!.id, newContact }))
    updateSearchResults(newContact)

    setLoading(false)
    setOpen(false)
  }

  return (
    <Modal open={open} setOpen={setOpen}>
      <div className="mt-3 sm:mt-5">
        <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Add to Contacts
        </DialogTitle>

        <div className="mx-auto mt-4 flex justify-center text-center">
          <Avatar src={user?.dp} alt={`display picture of ${user?.globalName}`} width={6} height={6} />
        </div>

        {user && (
          <div className="mt-2">
            <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-300">
              <GlobalName name={user.globalName} /> • @{user.username}
            </p>
          </div>
        )}

        <div className="mt-2">
          <p className="text-center text-sm text-gray-500 dark:text-gray-300">{user?.bio}</p>
        </div>

        <form className="mt-4" onSubmit={onSubmit}>
          <BaseInput
            label="By what name would you like to save this contact?"
            id="new_alias"
            name="new_alias"
            type="text"
            required
          />

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <BaseButton type="submit" loading={loading} className="sm:col-start-2">
              Add contact
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
