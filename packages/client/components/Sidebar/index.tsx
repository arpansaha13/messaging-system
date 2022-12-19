import { memo } from 'react'

import SearchBar from './SearchBar'
import SidebarHeader from './SidebarHeader'
import UnarchivedRooms from '../Convo/Unarchived'

const Sidebar = () => {
  return (
    <div className="h-full space-y-2">
      <SidebarHeader />
      <SearchBar />
      <UnarchivedRooms />
    </div>
  )
}
export default memo(Sidebar)
