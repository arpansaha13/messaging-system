import { memo } from 'react'

import { MicrophoneIcon } from '@heroicons/react/24/solid'
import { PaperClipIcon , FaceSmileIcon } from '@heroicons/react/24/outline'

import TypeArea from './TypeArea'

const ChatFooter = () => {

  const groupMenuItems = [
    {
      slot: 'Group info',
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
      slot: 'Mute notifications',
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
      slot: 'Exit group',
      onClick() {
        console.log('clicked')
      },
    },
  ]

  return (
    <div className='px-4 py-2.5 w-full flex items-center text-gray-400 bg-gray-800 space-x-1'>
      <button className='p-1 btn-icon'>
        <FaceSmileIcon className='w-7 h-7 flex-shrink-0' />
      </button>

      <button className='p-2 rounded-full hover:bg-gray-700/70 btn-icon'>
        <PaperClipIcon className='w-6 h-6 flex-shrink-0' />
      </button>

      <div className='px-1 flex-grow'>
        <TypeArea />
      </div>

      <button className='p-2 btn-icon'>
        <MicrophoneIcon className='w-6 h-6 flex-shrink-0' />
      </button>
    </div>
  )
}

export default memo(ChatFooter)
