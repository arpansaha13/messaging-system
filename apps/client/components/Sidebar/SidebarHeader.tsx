import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo } from 'react'
import { shallow } from 'zustand/shallow'
import { Icon } from '@iconify/react'
import githubIcon from '@iconify-icons/mdi/github'
import { ChatBubbleBottomCenterTextIcon, UserPlusIcon } from '@heroicons/react/20/solid'
import HeaderDropDown from '../HeaderDropDown'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'

const SidebarHeader = () => {
  const router = useRouter()
  const [resetStore] = useStore(state => [state.resetStore], shallow)

  const menuItems = [
    {
      slot: 'Log out',
      async onClick() {
        await _fetch('auth/logout', { method: 'POST' })
        router.replace('/auth/signin')
        resetStore()
      },
    },
  ]

  return (
    <header className="px-4 py-2.5 flex items-center justify-between bg-gray-100 dark:bg-gray-800 shadow-sm shadow-gray-400/30 dark:shadow-none">
      <p className="text-xl font-bold text-gray-950 dark:text-white">Chats</p>
      <div className="flex items-center text-gray-500 dark:text-gray-400 space-x-2">
        <a
          href="https://github.com/arpansaha13/whatsapp-clone"
          target="_blank"
          rel="noreferrer"
          className="block p-2 btn-icon cursor-pointer"
        >
          <Icon icon={githubIcon} className="flex-shrink-0" color="inherit" width={24} height={24} />
        </a>
        <Link href="/add-contact" className="p-2 btn-icon">
          <UserPlusIcon className="w-6 h-6 flex-shrink-0" />
        </Link>
        {/* <button className="p-2 btn-icon">
          <ViewfinderCircleIcon className="w-6 h-6 flex-shrink-0" />
        </button> */}
        <Link href="/contacts" className="p-2 btn-icon">
          <ChatBubbleBottomCenterTextIcon className="w-6 h-6 flex-shrink-0" />
        </Link>
        <HeaderDropDown menuItems={menuItems} />
      </div>
    </header>
  )
}

export default memo(SidebarHeader)
