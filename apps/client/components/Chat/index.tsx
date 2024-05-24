import { shallow } from 'zustand/shallow'
import ChatBody from './ChatBody'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'
import { useStore } from '~/store'

export default function ChatView() {
  const [chats, activeChat] = useStore(state => [state.chats, state.activeChat], shallow)

  const messages = activeChat === null ? null : chats.get(activeChat.receiver.id) ?? null

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
