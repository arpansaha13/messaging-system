// Components
import ChatArea from './ChatArea'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useChatListStore } from '../../stores/useChatListStore'

// Frequently updates on state change.
export default function ChatView() {
  const chats = useChatStore(state => state.chats)
  const activeRoomId = useChatListStore(state => state.activeRoomId)

  const messages = activeRoomId === null ? null : chats.get(activeRoomId) ?? null

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div className="flex-grow flex flex-col justify-end bg-gray-900">
        <ChatArea messages={messages} />
      </div>
      <ChatFooter />
    </div>
  )
}
