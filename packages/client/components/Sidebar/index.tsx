import { memo } from 'react'

import SidebarHeader from './SidebarHeader'
import SidebarSearchBar from './SidebarSearchBar'
import UnarchivedRooms from '../Convo/Unarchived'

const Sidebar = () => {
  return (
    <div className="h-full space-y-2">
      <SidebarHeader />
      <SidebarSearchBar />
      <UnarchivedRooms />
    </div>
  )
}
export default memo(Sidebar)
