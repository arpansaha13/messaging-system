'use client'

import { useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { shallow } from 'zustand/shallow'
import { isNullOrUndefined } from '@arpansaha13/utils'
import SearchBar from '~common/SearchBar'
import StackedListItem from '~common/StackedListItem'
import GlobalName from '~/components/GlobalName'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { IUser } from '@pkg/types'

interface IUserSearchResult extends IUser {
  contact: {
    id: number
    alias: string
  } | null
}

interface SearchResultsProps {
  results: IUserSearchResult[]
  handleClick: (user: IUserSearchResult) => void
}

export default function Page() {
  const [setActiveChat] = useStore(state => [state.setActiveChat], shallow)

  const isFirstRun = useRef(true)
  const [value, setValue] = useState('')
  const [searchResults, setSearchResults] = useState<IUserSearchResult[] | null>(null)

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
      _fetch(`users/search?text=${value}`).then(setSearchResults)
    },
    1000,
    [value],
  )

  function handleClick(user: IUserSearchResult) {
    setActiveChat({
      contact: user.contact ?? null,
      receiver: {
        id: user.id,
        dp: user.dp,
        bio: user.bio,
        username: user.username,
        globalName: user.globalName,
      },
    })
  }

  return (
    <div className="py-2">
      <SearchBar id="search" name="search" placeholder="Search" type="text" value={value} setValue={setValue} />

      {!isNullOrUndefined(searchResults) && <SearchResults results={searchResults} handleClick={handleClick} />}
    </div>
  )
}

function SearchResults({ results, handleClick }: Readonly<SearchResultsProps>) {
  return (
    <ul className="py-3">
      {results.map(user => (
        <StackedListItem
          key={user.id}
          image={user.dp}
          title={user.contact ? user.contact.alias : <GlobalName name={user.globalName} />}
          subtitle={user.contact ? `${user.globalName} • @${user.username}` : `@${user.username}`}
          text={user.bio}
          onClick={() => handleClick(user)}
        />
      ))}
    </ul>
  )
}
