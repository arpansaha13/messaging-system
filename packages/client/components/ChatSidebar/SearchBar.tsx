import { memo } from 'react'
// Icons
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import { FunnelIcon } from '@heroicons/react/24/outline'

const SearchBar = () => {
  return (
    <div className='pl-1.5'>
      <div className="flex items-center">
        <div className="flex-grow px-1.5">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              name="search"
              className="block w-full rounded-lg text-gray-200 bg-gray-800 py-2 pl-16 pr-3 text-sm placeholder-gray-400 focus:outline-none"
              placeholder="Search or start new chat"
              type="search"
            />
          </div>
        </div>
        <button className='mr-1.5 px-1.5 py-0.5 btn-icon'>
          <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
export default memo(SearchBar)
