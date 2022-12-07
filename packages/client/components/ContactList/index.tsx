import { memo } from 'react'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Components
import ContactListItem from './ContactListItem'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useContactStore } from '../../stores/useContactStore'
import { useChatListStore } from '../../stores/useChatListStore'
// Types
import type { ContactType, MessageType } from '../../types/index.types'

export const ContactList = () => {
  const fetchHook = useFetch()
  const add = useChatStore(state => state.add)
  const chats = useChatStore(state => state.chats)
  const contacts = useContactStore(state => state.contacts)
  const setActiveChatUser = useChatStore(state => state.setActiveChatUser)
  const setActiveChatUserId = useChatListStore(state => state.setActiveChatUserId)

  async function handleClick(contact: ContactType) {
    setActiveChatUserId(contact.userId)
    setActiveChatUser(contact)

    if (!chats.has(contact.userId)) {
      const chatRes: MessageType[] = await fetchHook(`chats/${contact.userId}`)
      add(contact.userId, chatRes)
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
