'use client'

import { useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { shallow } from 'zustand/shallow'
import { isNullOrUndefined } from '@arpansaha13/utils'
import SearchBar from '~common/SearchBar'
import ContactListItem from '~/components/ContactList/ContactListItem'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { ContactType, MessageType } from '@pkg/types'

interface ContactsProps {
  handleClick: (contact: ContactType) => void
}

interface SearchResultsProps {
  results: ContactType[]
  handleClick: (contact: ContactType) => void
}

export default function Page() {
  const [add, chats, searchConvo, setActiveChat, setProxyChat] = useStore(
    state => [state.addChat, state.chats, state.searchConvo, state.setActiveChat, state.setProxyChat],
    shallow,
  )

  const isFirstRun = useRef(true)
  const [value, setValue] = useState('')
  const [searchResults, setSearchResults] = useState<ContactType[] | null>(null)

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

  async function handleClick(contact: ContactType) {
    setActiveChat({
      contact: {
        id: contact.contactId,
        alias: contact.alias,
      },
      receiver: {
        id: contact.userId,
        username: contact.username,
        dp: contact.dp,
        globalName: contact.globalName,
      },
    })
    const convo = searchConvo(contact.userId)
    setProxyChat(convo === null)

    if (convo && !chats.has(convo.receiver.id)) {
      const chatRes: MessageType[] = await _fetch(`messages/${convo.receiver.id}`)
      add(convo.receiver.id, chatRes)
    }
  }

  return (
    <div className="py-2">
      <SearchBar id="search" name="search" placeholder="Search" type="text" value={value} setValue={setValue} />

      {isNullOrUndefined(searchResults) ? (
        <Contacts handleClick={handleClick} />
      ) : (
        <SearchResults results={searchResults} handleClick={handleClick} />
      )}
    </div>
  )
}

function Contacts({ handleClick }: ContactsProps) {
  const contacts = useStore(state => state.contacts)

  return Object.keys(contacts).map(letter => (
    <div key={letter} className="relative">
      {/* Size of image = h-12 w-12 */}
      <div className="mx-3 my-2 h-12 w-12 flex items-center justify-center font-medium text-gray-500 dark:text-emerald-500">
        <h3>{letter}</h3>
      </div>

      <ul role="list">
        {contacts[letter as keyof typeof contacts].map(contact => (
          <ContactListItem key={contact.contactId} {...contact} onClick={() => handleClick(contact)} />
        ))}
      </ul>
    </div>
  ))
}

function SearchResults({ results, handleClick }: SearchResultsProps) {
  return (
    <ul role="list" className="py-3">
      {results.map(contact => (
        <ContactListItem key={contact.contactId} {...contact} onClick={() => handleClick(contact)} />
      ))}
    </ul>
  )
}
