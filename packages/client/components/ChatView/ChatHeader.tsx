import { EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { memo } from 'react'

import DropDown from '../DropDown'

const ChatHeader = () => {

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
    <header className='px-4 py-2.5 flex items-center justify-between bg-gray-800'>
      <div className='flex items-center text-gray-400 space-x-3'>
        <img className="h-10 w-10 rounded-full" src='https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' alt="" />

        <p className='text-gray-50 font-semibold'>Name</p>
      </div>

      <div className='flex items-center text-gray-400 space-x-2'>
        <button className='p-2 btn-icon'>
          <MagnifyingGlassIcon className='w-6 h-6 flex-shrink-0' />
        </button>

        <DropDown
          buttonSlot={ <EllipsisVerticalIcon className='w-6 h-6 flex-shrink-0' /> }
          menuItems={ groupMenuItems }
        />
      </div>
    </header>
  )
}

export default memo(ChatHeader)
