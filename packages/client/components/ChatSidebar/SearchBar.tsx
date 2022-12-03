import { memo, useRef, useState } from 'react'
// Icons
import { ArrowLeftIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { FunnelIcon } from '@heroicons/react/24/outline'
import classNames from '../../utils/classNames'

const SearchBar = () => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function clear() {
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <div className="pl-1.5">
      <div className="flex items-center">
        <div className="flex-grow px-1.5">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              {value ? (
                <button onClick={() => setValue('')}>
                  <ArrowLeftIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </button>
              ) : (
                <MagnifyingGlassIcon className="pointer-events-none h-4 w-4 text-gray-400" aria-hidden="true" />
              )}
            </div>
            <input
              ref={inputRef}
              id="search"
              name="search"
              className="block w-full rounded-lg text-gray-200 bg-gray-800 py-2 pl-16 pr-8 text-sm border-none placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-none"
              placeholder="Search or start new chat"
              type="search"
              value={value}
              onChange={e => setValue(e.target.value)}
            />
            <div className={classNames(value ? 'absolute inset-y-0 right-0 flex items-center pr-2' : 'hidden')}>
              <button onClick={clear}>
                <XMarkIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <button className="mr-1.5 px-1.5 py-0.5 btn-icon">
          <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
export default memo(SearchBar)
