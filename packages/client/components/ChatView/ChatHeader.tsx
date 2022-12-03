import { memo } from 'react'
// Icons
import { EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
// Components
import Avatar from '../Avatar'
import DropDown from '../DropDown'
// Stores
import { useChatStore } from '../../stores/useChatStore'
import { useTypingState } from '../../stores/useTypingState'
// Utils
import classNames from '../../utils/classNames'

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
  const typingState = useTypingState(state => state.typingState)
  const activeChatUser = useChatStore(state => state.activeChatUser)!

  return (
    <header className="px-4 py-2.5 flex items-center justify-between bg-gray-800">
      <div className="flex items-center text-gray-400 space-x-3">
        <Avatar src={activeChatUser.dp} height={2.5} width={2.5} />

        <div>
          <p className="text-gray-50 font-semibold">{activeChatUser.name}</p>
          <p
            className={classNames(
              'text-xs transition-[height] duration-200 overflow-hidden',
              typingState[activeChatUser.userId] ? 'h-4' : 'h-0 delay-150',
            )}
          >
            <span
              className={classNames(
                'transition-opacity',
                typingState[activeChatUser.userId] ? 'opacity-100 delay-200' : 'opacity-0',
              )}
            >
              typing...
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center text-gray-400 space-x-2">
        <button className="p-2 btn-icon">
          <MagnifyingGlassIcon className="w-6 h-6 flex-shrink-0" />
        </button>

        <DropDown
          buttonSlot={<EllipsisVerticalIcon className="w-6 h-6 flex-shrink-0" />}
          menuItems={chatMenuItems}
          width={14.5}
        />
      </div>
    </header>
  )
}
export default memo(ChatHeader)
