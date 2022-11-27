import { memo } from 'react'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
import { useSocket } from '../../hooks/useSocket'
// Components
import StackedList from '../StackedList'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useContactStore } from '../../stores/useContactStore'
import { useChatListStore } from '../../stores/useChatListStore'
// Types
import type { ContactType } from '../../types'

export const ContactList = () => {
  const fetchHook = useFetch()
  const contacts = useContactStore(state => state.contacts)
  const setActiveChatUser = useChatStore(state => state.setActiveChatUser)
  const setActiveChatUserId = useChatListStore(
    state => state.setActiveChatUserId,
  )

  async function handleClick(contact: ContactType) {
    fetchHook(`chats/${contact.userId}`)
      .then(chat => {
        console.log(chat)
      })
      .catch(err => {
        console.log(err)
        setActiveChatUserId(contact.userId)
        setActiveChatUser(contact)
      })
  }

  return (
    <nav className="h-full overflow-y-scroll scrollbar" aria-label="Directory">
      {Object.keys(contacts).map(letter => (
        <div key={letter} className="relative">
          {/* Size of image = h-12 w-12 */}
          <div className="mx-3 my-2 h-12 w-12 flex items-center justify-center font-medium text-gray-500 dark:text-emerald-500">
            <h3>{letter}</h3>
          </div>

          <StackedList
            stackedList={contacts[letter as keyof typeof contacts]}
            handleClick={handleClick}
          />
        </div>
      ))}
    </nav>
  )
}
export default memo(ContactList)
