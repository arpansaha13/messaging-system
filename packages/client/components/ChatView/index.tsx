// Components
import ChatArea from './ChatArea'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'
// Hooks
import { useSize } from 'react-use'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useChatListStore } from '../../stores/useChatListStore'

// Not memoizing this component because it will frequently update on state change.
export default function ChatView() {
  const chats = useChatStore(state => state.chats)
  const activeChatUserId = useChatListStore(state => state.activeChatUserId)!

  const [child] = useSize(({ height }) => (
    <div className="flex-grow bg-gray-900">
      <ChatArea messages={chats.get(activeChatUserId) ?? null} height={height} />
    </div>
  ))

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      {child}
      <ChatFooter />
    </div>
  )
}
