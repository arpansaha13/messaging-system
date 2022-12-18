import shallow from 'zustand/shallow'
// Components
import RoomItem from './RoomItem'
// Store
import { useStore } from '../../stores/index.store'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Types
import type { ChatListItemType, MessageType } from '../../types/index.types'

export default function Archived() {
  const fetchHook = useFetch()

  const [add, chats, archivedChatList, setActiveChatInfo, setActiveRoom, setProxyRoom] = useStore(
    state => [
      state.addChat,
      state.chats,
      state.archivedChatList,
      state.setActiveChatInfo,
      state.setActiveRoom,
      state.setProxyRoom,
    ],
    shallow,
  )
  async function handleClick(listItem: ChatListItemType<true>) {
    setActiveRoom({
      id: listItem.room.id,
      archived: listItem.room.archived,
    })
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
    <div>
      <ul role="list">
        {archivedChatList.map(listItem => (
          <RoomItem
            key={listItem.room.id}
            roomId={listItem.room.id}
            dp={listItem.user.dp}
            alias={listItem.contact?.alias ?? null}
            latestMsg={listItem.latestMsg}
            archived={true}
            onClick={() => handleClick(listItem)}
          />
        ))}
      </ul>
    </div>
  )
}
