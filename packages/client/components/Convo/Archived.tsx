import shallow from 'zustand/shallow'
// Components
import ConvoItem from './ConvoItem'
// Store
import { useStore } from '../../stores/index.store'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Types
import type { ConvoItemType, MessageType } from '../../types/index.types'

export default function Archived() {
  const fetchHook = useFetch()

  const [add, chats, archivedConvo, setActiveChatInfo, setActiveRoom, setProxyConvo] = useStore(
    state => [
      state.addChat,
      state.chats,
      state.archivedConvo,
      state.setActiveChatInfo,
      state.setActiveRoom,
      state.setProxyConvo,
    ],
    shallow,
  )
  async function handleClick(convoItem: ConvoItemType<true>) {
    setActiveRoom({
      id: convoItem.room.id,
      archived: convoItem.room.archived,
    })
    setProxyConvo(false)
    setActiveChatInfo({
      contact: convoItem.contact ?? null,
      user: convoItem.user,
    })

    if (!chats.has(convoItem.room.id)) {
      const chatRes: MessageType[] = await fetchHook(`rooms/${convoItem.room.id}/messages`)
      add(convoItem.room.id, chatRes)
    }
  }
  return (
    <div>
      <ul role="list">
        {archivedConvo.map(convoItem => (
          <ConvoItem
            key={convoItem.room.id}
            roomId={convoItem.room.id}
            dp={convoItem.user.dp}
            alias={convoItem.contact?.alias ?? null}
            latestMsg={convoItem.latestMsg}
            archived={true}
            onClick={() => handleClick(convoItem)}
          />
        ))}
      </ul>
    </div>
  )
}
