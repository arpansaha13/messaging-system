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
  const activeChatUserId = useChatListStore(state => state.activeChatUserId)!

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div className="flex-grow flex flex-col justify-end bg-gray-900">
        <ChatArea messages={chats.get(activeChatUserId) ?? null} />
      </div>
      <ChatFooter />
    </div>
  )
}
