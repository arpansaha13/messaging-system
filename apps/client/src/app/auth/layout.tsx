import Notification from '~common/Notification'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout(props: Readonly<AuthLayoutProps>) {
  const { children } = props

  return (
    <>
      <Notification />

      <div className="flex min-h-full flex-col justify-center bg-gray-200 py-12 sm:px-6 lg:px-8 dark:bg-gray-800">
        {children}
      </div>
    </>
  )
}
