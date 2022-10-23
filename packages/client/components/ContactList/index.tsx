import { memo } from 'react'
// Components
import StackedList from '../StackedList'
// Stores
import { useContactStore } from '../../stores/useContactStore'

export const ContactList = () => {
  const contacts = useContactStore(state => state.contacts)

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
            // handleClick={handleClick}
          />
        </div>
      ))}
    </nav>
  )
}
export default memo(ContactList)
