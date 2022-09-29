// Components
import ChatArea from './ChatArea'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'

// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useChatListStore } from '../../stores/useChatListStore'

// Not memoizing this component because it will frequently update on state change.
export default function ChatView() {
  const chats = useChatStore(state => state.chats)
  const activeChat = useChatListStore(state => state.activeChat) as string

  return (
    <div className={ 'flex flex-col h-full' }>
      <ChatHeader />

      <div className='px-20 flex-grow bg-gray-900 overflow-auto'>
        <ChatArea messages={ chats.get(activeChat) ?? [] } />
      </div>

      <ChatFooter />
    </div>
  )
}
