import ChatListItem from './ChatListItem'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useChatListStore } from '../../stores/useChatListStore'
// Utils
import classNames from '../../utils/classNames'
// Types
import { ChatListItemType, MessageType } from '../../types'

export default function ChatList() {
  const add = useChatStore(state => state.add)
  const chats = useChatStore(state => state.chats)
  const chatList = useChatListStore(state => state.chatList)
  const activeChat = useChatListStore(state => state.activeChat)
  const setActiveChat = useChatListStore(state => state.setActiveChat)

  async function handleClick(chatListItem: ChatListItemType) {
    setActiveChat(chatListItem.userTag)

    if (!chats.has(chatListItem.userTag)) {
      const chatRes = await fetch(`http://localhost:4000/chats/${ chatListItem.userTag }`)
      const chat: MessageType[] = await chatRes.json()
      add(chatListItem.userTag, chat)
    }
  }

  return (
    <ul role="list">
      {
        chatList.map((chatListItem) => (
          <li key={ chatListItem.userTag }>
            <button className={classNames(
                'px-3 w-full text-left flex items-center relative',
                chatListItem.userTag === activeChat ? 'bg-gray-700/90' : 'hover:bg-gray-600/40'
              )}
              onClick={ () => handleClick(chatListItem) }
            >
              <span className='absolute inset-0' />
              <ChatListItem chatListItem={ chatListItem } />
            </button>
          </li>
        ))
      }
    </ul>
  )
}
