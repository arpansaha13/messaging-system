'use client'

import { useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { shallow } from 'zustand/shallow'
import { isNullOrUndefined } from '@arpansaha13/utils'
import SearchBar from '~common/SearchBar'
import StackedListItem from '~common/StackedListItem'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { IContact, IContextMenuItem } from '@pkg/types'

interface ContactsProps {
  handleClick: (contact: IContact) => void
}

interface SearchResultsProps {
  results: IContact[]
  handleClick: (contact: IContact) => void
}

export default function Page() {
  const [setActiveChat] = useStore(state => [state.setActiveChat], shallow)

  const isFirstRun = useRef(true)
  const [value, setValue] = useState('')
  const [searchResults, setSearchResults] = useState<IContact[] | null>(null)

  const menuItems: IContextMenuItem[] = []

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
        <Contacts handleClick={handleClick} />
      ) : (
        <SearchResults results={searchResults} handleClick={handleClick} />
      )}
    </div>
  )
}

function Contacts({ handleClick }: Readonly<ContactsProps>) {
  const contacts = useStore(state => state.contacts)

  return Object.keys(contacts).map(letter => (
    <div key={letter} className="relative">
      {/* Size of image = h-12 w-12 */}
      <div className="mx-3 my-2 h-12 w-12 flex items-center justify-center font-medium text-gray-500 dark:text-emerald-500">
        <h3>{letter}</h3>
      </div>

      <ul>
        {contacts[letter as keyof typeof contacts].map(contact => (
          <StackedListItem
            key={contact.contactId}
            image={contact.dp}
            title={contact.alias}
            subtitle={`${contact.globalName} • @${contact.username}`}
            text={contact.bio}
            onClick={() => handleClick(contact)}
          />
        ))}
      </ul>
    </div>
  ))
}

function SearchResults({ results, handleClick }: Readonly<SearchResultsProps>) {
  return (
    <ul className="py-3">
      {results.map(contact => (
        <StackedListItem
          key={contact.contactId}
          image={contact.dp}
          title={contact.alias}
          subtitle={`${contact.globalName} • @${contact.username}`}
          text={contact.bio}
          onClick={() => handleClick(contact)}
        />
      ))}
    </ul>
  )
}
