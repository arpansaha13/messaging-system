import Link from 'next/link'
import GithubIcon from '../components/common/GithubIcon'
import Notification from '../components/common/Notification'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="w-screen h-screen">
      <Notification />

      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-200 dark:bg-gray-800">
        {children}

        <Link
          href="https://github.com/arpansaha13/whatsapp-clone"
          target="_blank"
          rel="noreferrer"
          className="block p-4 fixed right-8 bottom-6 rounded-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-black shadow cursor-pointer transition-colors"
        >
          <GithubIcon width={28} height={28} />
        </Link>
      </div>
    </div>
  )
}
