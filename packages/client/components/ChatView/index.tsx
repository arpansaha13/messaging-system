import shallow from 'zustand/shallow'
// Components
import ChatArea from './ChatArea'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'
// Store
import { useStore } from '../../stores/index.store'

// Frequently updates on state change.
export default function ChatView() {
  const [chats, activeRoom] = useStore(state => [state.chats, state.activeRoom], shallow)

  const messages = activeRoom === null ? null : chats.get(activeRoom.id) ?? null

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
