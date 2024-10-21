'use client'

import { useState } from 'react'
import { useDebounce } from 'react-use'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { Input } from '~/components/ui'
import { Avatar, SearchBar, FormModal, StackedListItem } from '~/components/common'
import GlobalName from '~/components/GlobalName'
import { useAppDispatch } from '~/store/hooks'
import { upsertChatListItemContact } from '~/store/features/chat-list/chat-list.slice'
import { useLazySearchUsersQuery } from '~/store/features/users/users.api.slice'
import { useAddContactMutation } from '~/store/features/contacts/contact.api.slice'
import { invalidateTags as invalidateUsersApiTags } from '~/store/features/users/users.api.slice'
import { USER_API_TAG } from '~/store/features/constants'
import getFormData from '~/utils/getFormData'
import type { IContextMenuItem, IUserSearchResult } from '@shared/types/client'

interface SearchResultsProps {
  results: IUserSearchResult[]
  menuItems: IContextMenuItem[]
}

interface AddContactModalProps {
  open: boolean
  user: IUserSearchResult | null
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  refetchSearchResults: () => Promise<any>
}

export default function Page() {
  const [value, setValue] = useState('')
  const [triggerSearch, { data: searchResults }] = useLazySearchUsersQuery()
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
      triggerSearch(value)
    },
    1000,
    [value],
  )

  async function refetchSearchResults() {
    return triggerSearch(value)
  }

  return (
    <div className="py-2">
      <SearchBar id="search" name="search" placeholder="Search" type="text" value={value} setValue={setValue} />

      {!isNullOrUndefined(searchResults) && <SearchResults results={searchResults} menuItems={menuItems} />}

      <AddContactModal
        open={addContactModalOpen}
        user={modalPayload}
        setOpen={setAddContactModalOpen}
        refetchSearchResults={refetchSearchResults}
      />
    </div>
  )
}

function SearchResults({ results, menuItems }: Readonly<SearchResultsProps>) {
  return (
    <ul className="py-3">
      {results.map(user => (
        <StackedListItem
          key={user.id}
          href={{ query: { to: user.id } }}
          image={user.dp}
          title={user.contact ? user.contact.alias : <GlobalName name={user.globalName} />}
          subtitle={user.contact ? `${user.globalName} • @${user.username}` : `@${user.username}`}
          text={user.bio}
          {...(isNullOrUndefined(user.contact) && { menuItems, payload: user })}
        />
      ))}
    </ul>
  )
}

function AddContactModal(props: Readonly<AddContactModalProps>) {
  const { open, user, setOpen, refetchSearchResults } = props

  const dispatch = useAppDispatch()
  const [addContact] = useAddContactMutation()

  async function addToContacts(e: React.FormEvent<HTMLFormElement>) {
    const formData = getFormData(e.currentTarget)
    const { data: newContact } = await addContact({ userIdToAdd: user!.id, alias: formData.new_alias as string })
    dispatch(upsertChatListItemContact({ receiverId: user!.id, newContact: newContact! }))
    dispatch(invalidateUsersApiTags([{ type: USER_API_TAG, id: user!.id }]))
    await refetchSearchResults()
    setOpen(false)
  }

  return (
    <FormModal
      open={open}
      setOpen={setOpen}
      action={addToContacts}
      heading="Add to Contacts"
      submitButtonText="Add contact"
    >
      <>
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

        <Input
          label="By what name would you like to save this contact?"
          id="new_alias"
          name="new_alias"
          type="text"
          required
          className="mt-4"
        />
      </>
    </FormModal>
  )
}
