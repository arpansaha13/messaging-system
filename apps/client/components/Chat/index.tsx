import { shallow } from 'zustand/shallow'
import ChatBody from './ChatBody'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'
import { useStore } from '../../stores/index.store'

// Frequently updates on state change.
export default function ChatView() {
  const [chats, activeRoom] = useStore(state => [state.chats, state.activeRoom], shallow)

  const messages = activeRoom === null ? null : chats.get(activeRoom.id) ?? null

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div className="flex-grow flex flex-col justify-end bg-slate-200/50 dark:bg-gray-900">
        <ChatBody messages={messages} />
      </div>
      <ChatFooter />
    </div>
  )
}
