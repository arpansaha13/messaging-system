import SidebarHeader from './SidebarHeader'
import ChatList from './ChatList'
import SearchBar from './SearchBar'

export default function ChatSidebar() {
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
