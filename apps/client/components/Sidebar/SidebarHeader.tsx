import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { shallow } from 'zustand/shallow'
// Icons
import { Icon } from '@iconify/react'
import githubIcon from '@iconify-icons/mdi/github'
import { ChatBubbleBottomCenterTextIcon, UserPlusIcon } from '@heroicons/react/20/solid'
// Components
import Avatar from '~common/Avatar'
import HeaderDropDown from '../HeaderDropDown'
// Stores
import { useStore } from '~/store'
import { useAuthStore } from '~/store/useAuthStore'

const SidebarHeader = () => {
  const router = useRouter()
  const [authUser, resetAuthState] = useAuthStore(state => [state.authUser!, state.resetAuthState])
  const [toggleSlideOver, setSlideOverState, resetStore] = useStore(
    state => [state.toggleSlideOver, state.setSlideOverState, state.resetStore],
    shallow,
  )

  const menuItems = [
    // {
    //   slot: 'New group',
    //   onClick() {
    //     setSlideOverState({
    //       title: 'Add group participants',
    //       // componentName: 'ContactList'
    //     })
    //     toggleSlideOver(true)
    //   },
    // },
    {
      slot: 'Archived',
      onClick() {
        setSlideOverState({
          title: 'Archived',
          componentName: 'Archived',
        })
        toggleSlideOver(true)
      },
    },
    // {
    //   slot: 'Starred messages',
    //   onClick() {
    //     setSlideOverState({
    //       title: 'Starred messages',
    //       // componentName: 'StarredMessages'
    //     })
    //     toggleSlideOver(true)
    //   },
    // },
    {
      slot: 'Settings',
      onClick() {
        setSlideOverState({
          title: 'Settings',
          componentName: 'Settings',
        })
        toggleSlideOver(true)
      },
    },
    {
      slot: 'Log out',
      onClick() {
        router.replace('/auth/signin')
        resetAuthState()
        resetStore()
      },
    },
  ]
  function openNewChatMenu() {
    setSlideOverState({
      title: 'New chat',
      componentName: 'ContactList',
    })
    toggleSlideOver(true)
  }
  function openProfile() {
    setSlideOverState({
      title: 'Profile',
      componentName: 'Profile',
    })
    toggleSlideOver(true)
  }
  function openAddContactMenu() {
    setSlideOverState({
      title: 'Add new contact',
      componentName: 'AddContact',
    })
    toggleSlideOver(true)
  }

  return (
    <header className="px-4 py-2.5 flex items-center justify-between bg-gray-100 dark:bg-gray-800 shadow-sm shadow-gray-400/30 dark:shadow-none">
      {authUser !== null && (
        <button onClick={openProfile}>
          <Avatar src={authUser.dp} width={2.5} height={2.5} />
        </button>
      )}

      <div className="flex items-center text-gray-500 dark:text-gray-400 space-x-2">
        <a
          href="https://github.com/arpansaha13/whatsapp-clone"
          target="_blank"
          rel="noreferrer"
          className="block p-2 btn-icon cursor-pointer"
        >
          <Icon icon={githubIcon} className="flex-shrink-0" color="inherit" width={24} height={24} />
        </a>
        <button className="p-2 btn-icon" onClick={openAddContactMenu}>
          <UserPlusIcon className="w-6 h-6 flex-shrink-0" />
        </button>
        {/* <button className="p-2 btn-icon">
          <ViewfinderCircleIcon className="w-6 h-6 flex-shrink-0" />
        </button> */}
        <button className="p-2 btn-icon" onClick={openNewChatMenu}>
          <ChatBubbleBottomCenterTextIcon className="w-6 h-6 flex-shrink-0" />
        </button>
        <HeaderDropDown menuItems={menuItems} />
      </div>
    </header>
  )
}
export default memo(SidebarHeader)
