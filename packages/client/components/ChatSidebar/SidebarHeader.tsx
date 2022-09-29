import { memo } from 'react'
import { ChatBubbleBottomCenterTextIcon, EllipsisVerticalIcon, ViewfinderCircleIcon } from '@heroicons/react/20/solid'

import DropDown from '../DropDown'

const SidebarHeader = () => {

  const menuItems = [
    {
      slot: 'New group',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Archived',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Starred messages',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Settings',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Log out',
      onClick() {
        console.log('clicked')
      },
    },
  ]

  return (
    <header className='px-4 py-2.5 flex items-center justify-between bg-gray-800'>
      <img className="h-10 w-10 rounded-full" src='https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' alt="" />

      <div className='flex items-center text-gray-400 space-x-2'>
        <button className='p-2 btn-icon'>
          <ViewfinderCircleIcon className='w-6 h-6 flex-shrink-0' />
        </button>
        <button className='p-2 btn-icon'>
          <ChatBubbleBottomCenterTextIcon className='w-6 h-6 flex-shrink-0' />
        </button>
        <DropDown
          buttonSlot={ <EllipsisVerticalIcon className='w-6 h-6 flex-shrink-0' /> }
          menuItems={ menuItems }
        />
      </div>
    </header>
  )
}
export default memo(SidebarHeader)
