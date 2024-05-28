import Notification from '~common/Notification'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <Notification />

      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-200 dark:bg-gray-800">
        {children}
      </div>
    </>
  )
}
