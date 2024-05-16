'use client'

import Link from 'next/link'
import { useSocketInit } from '~/hooks/useSocket'
import {
  ArchiveBoxIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import Avatar from '~common/Avatar'
import Notification from '~common/Notification'
import { useAuthStore } from '~/store/useAuthStore'

interface AsyncPageProps {
  children: React.ReactNode
}

/** This is the main page to be shown for an **authorized** user */
export default function AsyncPage({ children }: Readonly<AsyncPageProps>) {
  useSocketInit()

  const authUser = useAuthStore(state => state.authUser!)

  return (
    <div className="flex h-screen">
      <Notification />

      <nav className="flex-shrink-0 py-4 w-16 h-full flex flex-col items-center bg-gray-100 dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70">
        <Link href="/" className="block">
          <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 flex-shrink-0" />
        </Link>

        <Link href="/contacts" className="mt-3 block">
          <ChatBubbleBottomCenterTextIcon className="w-6 h-6 flex-shrink-0" />
        </Link>

        <Link href="/add-contact" className="mt-3 block">
          <UserPlusIcon className="w-6 h-6 flex-shrink-0" />
        </Link>

        <Link href="/archived" className="mt-auto block">
          <ArchiveBoxIcon className="w-6 h-6 flex-shrink-0" />
        </Link>

        <Link href="/settings" className="mt-3 block">
          <Cog6ToothIcon className="w-6 h-6 flex-shrink-0" />
        </Link>

        {authUser !== null && (
          <Link href="/settings/profile" className="mt-4 block">
            <Avatar src={authUser.dp} width={2} height={2} />
          </Link>
        )}
      </nav>

      <main className="flex-grow">{children}</main>
    </div>
  )
}
