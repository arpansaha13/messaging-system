'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'
import { classNames } from '@arpansaha13/utils'
import _fetch from '~/utils/_fetch'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: Readonly<SettingsLayoutProps>) {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Profile',
      href: '/settings/profile',
    },
    {
      name: 'Appearance',
      href: '/settings/appearance',
    },
  ]

  async function logout() {
    await _fetch('auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return (
    <div className="h-full">
      <div className="h-full flex">
        <div className="h-full py-16 w-[28rem] bg-gray-300 dark:bg-gray-800 transition-colors">
          <div className="ml-auto w-48 space-y-1">
            {tabs.map(tab => (
              <Link
                key={tab.name}
                href={tab.href}
                className={classNames(
                  'block w-full px-4 py-2 text-sm rounded-l-md transition-colors',
                  pathname === tab.href ? 'bg-gray-100 dark:bg-gray-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700',
                )}
              >
                {tab.name}
              </Link>
            ))}

            <button
              className={classNames(
                'flex justify-between w-full px-4 py-2 text-sm rounded-l-md transition-colors hover:bg-gray-300 dark:hover:bg-gray-700',
              )}
              onClick={logout}
            >
              <p>Log out</p>
              <ArrowRightStartOnRectangleIcon className="flex-shrink-0 w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-grow h-full py-16 px-8 col-span-3 bg-gray-100 dark:bg-gray-900 transition-colors overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
