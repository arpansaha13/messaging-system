import { memo } from 'react'
import Router from 'next/router'
// Icons
import { ChatBubbleBottomCenterTextIcon, EllipsisVerticalIcon, ViewfinderCircleIcon } from '@heroicons/react/20/solid'
// Stores
import { useAuthStore } from '../../stores/useAuthStore'
import { useSlideOverState } from '../../stores/useSlideOverState'
// Components
import DropDown from '../DropDown'

const SidebarHeader = () => {
  const resetAuthState = useAuthStore(state => state.resetAuthState)

  const toggle = useSlideOverState(state => state.toggle)
  const setTitle = useSlideOverState(state => state.setTitle)
  const setComponentName = useSlideOverState(state => state.setComponentName)

  const menuItems = [
    {
      slot: 'New group',
      onClick() {
        setTitle('Add group participants')
        // setComponentName('ContactList')
        toggle(true)
      },
    },
    {
      slot: 'Archived',
      onClick() {
        setTitle('Archived')
        // setComponentName('Archived')
        toggle(true)
      },
    },
    {
      slot: 'Starred messages',
      onClick() {
        setTitle('Starred messages')
        // setComponentName('StarredMessages')
        toggle(true)
      },
    },
    {
      slot: 'Settings',
      onClick() {
        setTitle('Settings')
        // setComponentName('Settings')
        toggle(true)
      },
    },
    {
      slot: 'Log out',
      onClick() {
        Router.replace('/auth/signin')
        resetAuthState()
      },
    },
  ]

  function openNewChatMenu() {
    setTitle('New chat')
    setComponentName('ContactList')
    toggle(true)
  }

  return (
    <header className="px-4 py-2.5 flex items-center justify-between bg-gray-800">
      <img
        className="h-10 w-10 rounded-full"
        src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        alt=""
      />

      <div className="flex items-center text-gray-400 space-x-2">
        <button className="p-2 btn-icon">
          <ViewfinderCircleIcon className="w-6 h-6 flex-shrink-0" />
        </button>
        <button className="p-2 btn-icon" onClick={openNewChatMenu}>
          <ChatBubbleBottomCenterTextIcon className="w-6 h-6 flex-shrink-0" />
        </button>
        <DropDown buttonSlot={<EllipsisVerticalIcon className="w-6 h-6 flex-shrink-0" />} menuItems={menuItems} />
      </div>
    </header>
  )
}
export default memo(SidebarHeader)
