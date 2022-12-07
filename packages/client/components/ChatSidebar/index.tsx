import { memo } from 'react'
// Components
import SearchBar from './SearchBar'
import SidebarHeader from './SidebarHeader'
import ChatSidebarItem from './ChatSidebarItem'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useChatListStore } from '../../stores/useChatListStore'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Types
import { ChatListItemType, MessageType } from '../../types/index.types'

const ChatSidebar = () => {
  const fetchHook = useFetch()

  const add = useChatStore(state => state.add)
  const chats = useChatStore(state => state.chats)
  const chatList = useChatListStore(state => state.chatList)
  const activeChatUserId = useChatListStore(state => state.activeChatUserId)
  const setActiveChatUser = useChatStore(state => state.setActiveChatUser)
  const setActiveChatUserId = useChatListStore(state => state.setActiveChatUserId)

  async function handleClick(listItem: ChatListItemType) {
    setActiveChatUserId(listItem.userId)
    setActiveChatUser({
      userId: listItem.userId,
      name: listItem.alias,
      bio: listItem.bio,
      dp: listItem.dp,
    })

    if (!chats.has(listItem.userId)) {
      const chatRes: MessageType[] = await fetchHook(`chats/${listItem.userId}`)
      add(listItem.userId, chatRes)
    }
  }
  return (
    <div className="h-full space-y-2">
      <SidebarHeader />
      <SearchBar />

      {/* className="overflow-auto" */}
      <div>
        <ul role="list">
          {chatList.map(listItem => (
            <ChatSidebarItem
              key={listItem.userId}
              {...listItem}
              active={activeChatUserId}
              onClick={() => handleClick(listItem)}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}
export default memo(ChatSidebar)
