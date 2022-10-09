import { memo } from 'react'
// Components
import SearchBar from './SearchBar'
import StackedList from '../StackedList'
import SidebarHeader from './SidebarHeader'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useChatListStore } from '../../stores/useChatListStore'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Types
import { ChatListItemType, MessageType } from '../../types'

const ChatSidebar = () => {
  const fetchHook = useFetch()

  const add = useChatStore(state => state.add)
  const chats = useChatStore(state => state.chats)
  const chatList = useChatListStore(state => state.chatList)
  const activeChat = useChatListStore(state => state.activeChat)
  const setActiveChat = useChatListStore(state => state.setActiveChat)

  async function handleClick(listItem: ChatListItemType) {
    setActiveChat(listItem.user_id)

    if (!chats.has(listItem.user_id)) {
      const chatRes = await fetchHook(`chats/${listItem.user_id}`)
      const chat: MessageType[] = await chatRes.json()
      add(listItem.user_id, chat)
    }
  }
  return (
    <div className="h-full space-y-2">
      <SidebarHeader />
      <SearchBar />

      <div className="overflow-auto">
        <StackedList
          active={activeChat}
          stackedList={chatList}
          handleClick={handleClick}
        />
      </div>
    </div>
  )
}
export default memo(ChatSidebar)
