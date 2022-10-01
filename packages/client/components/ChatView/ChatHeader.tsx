import { memo } from 'react'
// Icons
import { EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
// Components
import DropDown from '../DropDown'
// Sotres
import { useContactStore } from '../../stores/useContactStore'
import { useChatListStore } from '../../stores/useChatListStore'

const ChatHeader = () => {
  const chatMenuItems = [
    {
      slot: 'Contact info',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Select Messages',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Close chat',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Mute notifications',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Disappearing messages',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Clear messages',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Delete chat',
      onClick() {
        console.log('clicked')
      },
    },
  ]
  const contacts = useContactStore(state => state.contacts)
  const activeChat = useChatListStore(state => state.activeChat) as string
  /**
   * The details of the user whose chat is opened.
   */
  const activeChatUser = contacts.get(activeChat)!

  return (
    <header className='px-4 py-2.5 flex items-center justify-between bg-gray-800'>
      <div className='flex items-center text-gray-400 space-x-3'>
        <img className="h-10 w-10 rounded-full" src={ activeChatUser.dp } alt="" />

        <p className='text-gray-50 font-semibold'>
          { activeChatUser.name }
        </p>
      </div>

      <div className='flex items-center text-gray-400 space-x-2'>
        <button className='p-2 btn-icon'>
          <MagnifyingGlassIcon className='w-6 h-6 flex-shrink-0' />
        </button>

        <DropDown
          buttonSlot={ <EllipsisVerticalIcon className='w-6 h-6 flex-shrink-0' /> }
          menuItems={ chatMenuItems }
          width={ 14.5 }
        />
      </div>
    </header>
  )
}
// Memoizing because this component should only update when `activeChat` changes.
export default memo(ChatHeader)
