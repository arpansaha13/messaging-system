import { memo } from 'react'
import shallow from 'zustand/shallow'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Components
import ContactListItem from './ContactListItem'
// Stores
import { useStore } from '../../stores/index.store'
// Types
import type { ContactType, MessageType } from '../../types/index.types'

export const ContactList = () => {
  const fetchHook = useFetch()

  const [add, chats, contacts, searchRoomIdByUserId, setActiveChatInfo, setActiveRoomId, setProxyRoom] = useStore(
    state => [
      state.addChat,
      state.chats,
      state.contacts,
      state.searchRoomIdByUserId,
      state.setActiveChatInfo,
      state.setActiveRoomId,
      state.setProxyRoom,
    ],
    shallow,
  )

  async function handleClick(contact: ContactType) {
    setActiveChatInfo({
      contact: {
        id: contact.contactId,
        alias: contact.alias,
      },
      user: {
        id: contact.userId,
        bio: contact.bio,
        dp: contact.dp,
        displayName: contact.displayName,
      },
    })
    const roomId = searchRoomIdByUserId(contact.userId)
    setActiveRoomId(roomId)
    setProxyRoom(roomId === null)

    if (roomId && !chats.has(roomId)) {
      const chatRes: MessageType[] = await fetchHook(`rooms/${roomId}/messages`)
      add(roomId, chatRes)
    }
  }

  return (
    <nav className="h-full overflow-y-scroll scrollbar" aria-label="Directory">
      {Object.keys(contacts).map(letter => (
        <div key={letter} className="relative">
          {/* Size of image = h-12 w-12 */}
          <div className="mx-3 my-2 h-12 w-12 flex items-center justify-center font-medium text-gray-500 dark:text-emerald-500">
            <h3>{letter}</h3>
          </div>

          <ul role="list">
            {contacts[letter as keyof typeof contacts].map(contact => (
              <ContactListItem key={contact.contactId} {...contact} onClick={() => handleClick(contact)} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
export default memo(ContactList)
