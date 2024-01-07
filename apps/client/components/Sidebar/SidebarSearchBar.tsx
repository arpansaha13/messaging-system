import { memo, useState } from 'react'
// Components
import SearchBar from '~common/SearchBar'
// import { FunnelIcon } from '@heroicons/react/24/outline'

const SidebarSearchBar = () => {
  const [value, setValue] = useState('')

  return (
    <div className="pl-1.5">
      <div className="flex items-center">
        <div className="flex-grow px-1.5">
          <SearchBar
            id="search"
            name="search"
            placeholder="Search or start new chat"
            type="search"
            value={value}
            setValue={setValue}
          />
        </div>
        {/* <button className="mr-1.5 px-1.5 py-0.5 btn-icon">
          <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </button> */}
      </div>
    </div>
  )
}
export default memo(SidebarSearchBar)
