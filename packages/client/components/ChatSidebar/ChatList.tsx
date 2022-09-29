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

  function handleClick(chatListItem: ChatListItemType) {
    setActiveChat(chatListItem.userTag)

    if (!chats.has(chatListItem.userTag)) {
      // Fetch from api
      const tempChat: MessageType[] = [
        {
          msg: 'My message',
          myMsg: true,
          time: '3:29 AM',
          status: 'delivered',
        },
        {
          msg: 'Other message',
          myMsg: false,
          time: '4:30 AM',
          status: 'sent',
        },
        {
          msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
          myMsg: true,
          time: '5:29 AM',
          status: 'read',
        },
      ]
      add(chatListItem.userTag, tempChat)
    }
  }

  return (
    <ul role="list">
      {
        chatList.map((chatListItem) => (
          <li key={chatListItem.userTag}>
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
