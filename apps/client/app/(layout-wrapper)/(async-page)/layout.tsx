'use client'

import Link from 'next/link'
import { shallow } from 'zustand/shallow'
import { useSocketInit } from '~/hooks/useSocket'
import { ArchiveBoxIcon, ChatBubbleOvalLeftEllipsisIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import Avatar from '~common/Avatar'
import Notification from '~common/Notification'
import Chat from '~/components/Chat'
import SidebarHeader from '~/components/Sidebar/SidebarHeader'
import { useStore } from '~/store'
import { useAuthStore } from '~/store/useAuthStore'

interface AsyncPageProps {
  children: React.ReactNode
}

/** This is the main page to be shown for an **authorized** user */
export default function AsyncPage({ children }: AsyncPageProps) {
  useSocketInit()

  const authUser = useAuthStore(state => state.authUser!)
  const [activeRoom, isProxyConvo] = useStore(state => [state.activeRoom, state.isProxyConvo], shallow)

  const showChatView = activeRoom !== null || isProxyConvo

  return (
    <main className="flex h-screen">
      <Notification />

      <nav className="flex-shrink-0 py-4 w-16 h-full flex flex-col items-center bg-gray-100 dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70">
        <Link href="/" className="block">
          <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 flex-shrink-0" />
        </Link>

        <Link href="/archived" className="mt-auto block">
          <ArchiveBoxIcon className="w-6 h-6 flex-shrink-0" />
        </Link>

        <Link href="/settings" className="mt-2 block">
          <Cog6ToothIcon className="w-6 h-6 flex-shrink-0" />
        </Link>

        {authUser !== null && (
          <Link href="/profile" className="mt-4 block">
            <Avatar src={authUser.dp} width={2} height={2} />
          </Link>
        )}
      </nav>

      <section className="flex-shrink-0 w-[26rem] h-full bg-white dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70 space-y-2 overflow-hidden flex flex-col">
        <SidebarHeader />
        {/* <SidebarSearchBar /> */}
        <div className="flex-grow overflow-y-auto scrollbar">{children}</div>
      </section>

      <section className="flex-grow h-full bg-gray-100 dark:bg-gray-800">{showChatView && <Chat />}</section>
    </main>
  )
}
