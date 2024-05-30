import { memo } from 'react'
import { shallow } from 'zustand/shallow'
import { classNames } from '@arpansaha13/utils'
// import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import Avatar from '~common/Avatar'
import GlobalName from '~/components/GlobalName'
import { useStore } from '~/store'

const ChatHeader = () => {
  const [typingState, activeChat] = useStore(state => [state.typingState, state.activeChat!], shallow)

  // const chatMenuItems = [
  //   {
  //     slot: 'Contact info',
  //     onClick() {
  //       console.log('clicked')
  //     },
  //   },
  //   {
  //     slot: 'Select Messages',
  //     onClick() {
  //       console.log('clicked')
  //     },
  //   },
  //   {
  //     slot: 'Close chat',
  //     onClick() {
  //       console.log('clicked')
  //     },
  //   },
  //   {
  //     slot: 'Mute notifications',
  //     onClick() {
  //       console.log('clicked')
  //     },
  //   },
  //   {
  //     slot: 'Disappearing messages',
  //     onClick() {
  //       console.log('clicked')
  //     },
  //   },
  //   {
  //     slot: 'Delete chat',
  //     onClick() {
  //       console.log('clicked')
  //     },
  //   },
  // ]

  return (
    <>
      <div className="flex items-center text-gray-900 dark:text-gray-400 space-x-3">
        <Avatar src={activeChat.receiver.dp} height={2.5} width={2.5} />

        <div>
          <p className="text-gray-800 dark:text-gray-50 font-semibold">
            {activeChat.contact?.alias ?? <GlobalName name={activeChat.receiver.globalName} />}
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

      {/* <div className="flex items-center text-gray-900 dark:text-gray-400 space-x-2">
        <button className="p-2 btn-icon">
          <MagnifyingGlassIcon className="w-6 h-6 flex-shrink-0" />
        </button>
      </div> */}
    </>
  )
}
export default memo(ChatHeader)
