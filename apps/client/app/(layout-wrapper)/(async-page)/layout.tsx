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
    <div className="flex h-full">
      <aside className="py-4 w-16 h-full flex flex-col items-center justify-between bg-gray-100 dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70">
        <div>
          <Link href="/" className="block">
            <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 flex-shrink-0" />
          </Link>
        </div>

        <div className="flex flex-col items-center">
          <Link href="/archived" className="block">
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
        </div>
      </aside>

      <main className="flex-grow grid grid-cols-10 h-full relative z-10">
        <Notification />
        {/* 'overflow-x-visible' for the dropdown. */}
        <section className="col-span-3 h-full bg-white dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70 relative overflow-x-visible">
          <div className="h-full space-y-2">
            <SidebarHeader />
            {/* <SidebarSearchBar /> */}
            {children}
          </div>
        </section>

        {<section className="col-span-7 h-full bg-gray-100 dark:bg-gray-800">{showChatView && <Chat />}</section>}
      </main>
    </div>
  )
}
