import Image from 'next/image'
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

      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-800">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto w-auto h-16 relative">
            <Image src="/react-logo.svg" alt="Whatsapp Clone" layout="fill" objectFit="contain" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {heading}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-900/90 py-8 px-4 shadow sm:rounded-lg sm:px-10">{children}</div>
        </div>
      </div>
    </div>
  )
}
