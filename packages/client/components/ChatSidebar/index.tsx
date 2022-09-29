import { memo } from 'react'

// Components
import SidebarHeader from './SidebarHeader'
import ChatList from './ChatList'
import SearchBar from './SearchBar'

const ChatSidebar = () => {
  return (
    <div className='h-full space-y-2'>
      <SidebarHeader />
      <SearchBar />

      <div className='overflow-auto'>
        <ChatList />
      </div>
    </div>
  )
}
export default memo(ChatSidebar)
