import Image from 'next/image'
// Icons
import { Icon } from '@iconify/react'
import githubIcon from '@iconify-icons/mdi/github'
// Components
import Notification from '../components/common/Notification'
// Types
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  heading: string
}

export default function AuthLayout({ children, heading }: AuthLayoutProps) {
  return (
    <div className="w-screen h-screen">
      <Notification />

      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-200 dark:bg-gray-800">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto w-auto h-16 relative">
            <Image src="/react-logo.svg" alt="Whatsapp Clone" layout="fill" objectFit="contain" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {heading}
          </h2>
        </div>

        {children}

        <a
          href="https://github.com/arpansaha13/whatsapp-clone"
          target="_blank"
          rel="noreferrer"
          className="block p-4 fixed right-8 bottom-6 rounded-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-black shadow cursor-pointer transition-colors"
        >
          <Icon icon={githubIcon} className="flex-shrink-0" color="inherit" width={28} height={28} />
        </a>
      </div>
    </div>
  )
}
