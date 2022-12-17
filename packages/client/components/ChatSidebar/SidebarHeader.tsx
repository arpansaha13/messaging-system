import { memo } from 'react'
import Router from 'next/router'
import shallow from 'zustand/shallow'
// Icons
import { ChatBubbleBottomCenterTextIcon, ViewfinderCircleIcon } from '@heroicons/react/20/solid'
// Stores
import { useStore } from '../../stores/index.store'
import { useAuthStore } from '../../stores/useAuthStore'
// Components
import HeaderDropDown from '../HeaderDropDown'

const SidebarHeader = () => {
  const resetAuthState = useAuthStore(state => state.resetAuthState)
  const [toggleSlideOver, setSlideOverState] = useStore(
    state => [state.toggleSlideOver, state.setSlideOverState],
    shallow,
  )

  const menuItems = [
    {
      slot: 'New group',
      onClick() {
        setSlideOverState({
          title: 'Add group participants',
          // componentName: 'ContactList'
        })
        toggleSlideOver(true)
      },
    },
    {
      slot: 'Archived',
      onClick() {
        setSlideOverState({
          title: 'Archived',
          // componentName: 'Archived'
        })
        toggleSlideOver(true)
      },
    },
    {
      slot: 'Starred messages',
      onClick() {
        setSlideOverState({
          title: 'Starred messages',
          // componentName: 'StarredMessages'
        })
        toggleSlideOver(true)
      },
    },
    {
      slot: 'Settings',
      onClick() {
        setSlideOverState({
          title: 'Settings',
          // componentName: 'Settings'
        })
        toggleSlideOver(true)
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
    setSlideOverState({
      title: 'New chat',
      // componentName: 'ContactList'
    })
    toggleSlideOver(true)
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
        <HeaderDropDown menuItems={menuItems} />
      </div>
    </header>
  )
}
export default memo(SidebarHeader)
