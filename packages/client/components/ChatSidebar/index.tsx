import { memo } from 'react'
import shallow from 'zustand/shallow'
// Components
import SearchBar from './SearchBar'
import SidebarHeader from './SidebarHeader'
import ChatSidebarItem from './ChatSidebarItem'
// Store
import { useStore } from '../../stores/index.store'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Types
import type { ChatListItemType, MessageType } from '../../types/index.types'

const ChatSidebar = () => {
  const fetchHook = useFetch()

  const [add, chats, chatList, activeRoomId, setActiveChatInfo, setActiveRoomId, setProxyRoom] = useStore(
    state => [
      state.addChat,
      state.chats,
      state.chatList,
      state.activeRoomId,
      state.setActiveChatInfo,
      state.setActiveRoomId,
      state.setProxyRoom,
    ],
    shallow,
  )

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
