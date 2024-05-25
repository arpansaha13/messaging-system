import { memo } from 'react'
import { shallow } from 'zustand/shallow'
import { classNames } from '@arpansaha13/utils'
// import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import Avatar from '~common/Avatar'
import HeaderDropDown from '../HeaderDropDown'
import { useStore } from '~/store'

const ChatHeader = () => {
  const [typingState, activeChat, clearConvoLatestMsg, clearChat] = useStore(
    state => [state.typingState, state.activeChat!, state.clearConvoLatestMsg, state.clearChat],
    shallow,
  )

  const chatMenuItems = [
    // {
    //   slot: 'Contact info',
    //   onClick() {
    //     console.log('clicked')
    //   },
    // },
    // {
    //   slot: 'Select Messages',
    //   onClick() {
    //     console.log('clicked')
    //   },
    // },
    // {
    //   slot: 'Close chat',
    //   onClick() {
    //     console.log('clicked')
    //   },
    // },
    // {
    //   slot: 'Mute notifications',
    //   onClick() {
    //     console.log('clicked')
    //   },
    // },
    // {
    //   slot: 'Disappearing messages',
    //   onClick() {
    //     console.log('clicked')
    //   },
    // },
    // Show 'Clear messages' only if the room exists
    {
      slot: 'Clear messages',
      onClick() {
        clearChat(activeChat.receiver.id)
        clearConvoLatestMsg(activeChat.receiver.id)
      },
    },
    // {
    //   slot: 'Delete chat',
    //   onClick() {
    //     console.log('clicked')
    //   },
    // },
  ]

  return (
    <header className="px-4 py-2.5 flex items-center justify-between bg-gray-100 dark:bg-gray-800 shadow-sm shadow-gray-400/30 dark:shadow-none relative z-10">
      <div className="flex items-center text-gray-900 dark:text-gray-400 space-x-3">
        <Avatar src={activeChat.receiver.dp} height={2.5} width={2.5} />

        <div>
          <p className="text-gray-800 dark:text-gray-50 font-semibold">
            {activeChat.contact?.alias ?? <span className="italic">{`~${activeChat.receiver.globalName}`}</span>}
          </p>
          <p
            className={classNames(
              'text-xs transition-[height] duration-200 overflow-hidden',
              typingState[activeChat.receiver.id] ? 'h-4' : 'h-0 delay-150',
            )}
          >
            <span
              className={classNames(
                'transition-opacity',
                typingState[activeChat.receiver.id] ? 'opacity-100 delay-200' : 'opacity-0',
              )}
            >
              typing...
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center text-gray-900 dark:text-gray-400 space-x-2">
        {/* <button className="p-2 btn-icon">
          <MagnifyingGlassIcon className="w-6 h-6 flex-shrink-0" />
        </button> */}

        <HeaderDropDown menuItems={chatMenuItems} width={14.5} />
      </div>
    </header>
  )
}
export default memo(ChatHeader)
