import ChatListItem from './ChatListItem'

import type { ChatListItemData } from '../../types'

/* This example requires Tailwind CSS v2.0+ */
const people: ChatListItemData[] = [
  {
    userTag: 'dsfgsdfsef',
    name: 'Calvin Hawkins',
    dp: 'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    latestMsg: 'Latest text message',
    muted: false,
    read: true,
    time: '3:49 AM',
    active: true,
  },
  {
    userTag: 'jghjgyjg',
    name: 'Kristen Ramos',
    dp: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    latestMsg: 'Latest text message',
    muted: false,
    read: true,
    time: '3:49 AM',
    active: false,
  },
  {
    userTag: 'cvbcgbfcgr',
    name: 'Ted Fox',
    dp: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    latestMsg: 'Latest text message',
    muted: false,
    read: true,
    time: '3:49 AM',
    active: false,
  },
]

export default function ChatList() {
  return (
    <ul role="list">
      {
        people.map((person) => (
          <li key={person.userTag}>
            <button className={`px-3 w-full text-left flex items-center relative ${ person.active ? 'bg-gray-700/90' : 'hover:bg-gray-600/40' }`}>
              <span className='absolute inset-0' />
              <ChatListItem person={ person } />
            </button>
          </li>
        ))
      }
    </ul>
  )
}
