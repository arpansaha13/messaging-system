import { memo } from 'react'
// Components
import SearchBar from './SearchBar'
import SidebarHeader from './SidebarHeader'
import UnarchivedRooms from '../Rooms/Unarchived'

const ChatSidebar = () => {
  return (
    <div className="h-full space-y-2">
      <SidebarHeader />
      <SearchBar />
      <UnarchivedRooms />
    </div>
  )
}
export default memo(ChatSidebar)
