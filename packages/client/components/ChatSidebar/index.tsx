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
  const activeRoomId = useChatListStore(state => state.activeRoomId)
  const setActiveChatInfo = useChatStore(state => state.setActiveChatInfo)
  const setActiveRoomId = useChatListStore(state => state.setActiveRoomId)
  const setProxyRoom = useChatListStore(state => state.setProxyRoom)

  async function handleClick(listItem: ChatListItemType) {
    setActiveRoomId(listItem.room.id)
    setProxyRoom(false)
    setActiveChatInfo({
      contact: listItem.contact ?? null,
      user: listItem.user,
    })

    if (!chats.has(listItem.room.id)) {
      const chatRes: MessageType[] = await fetchHook(`rooms/${listItem.room.id}/messages`)
      add(listItem.room.id, chatRes)
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
              key={listItem.room.id}
              active={activeRoomId}
              roomId={listItem.room.id}
              dp={listItem.user.dp}
              alias={listItem.contact?.alias ?? null}
              latestMsg={listItem.latestMsg}
              onClick={() => handleClick(listItem)}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}
export default memo(ChatSidebar)
