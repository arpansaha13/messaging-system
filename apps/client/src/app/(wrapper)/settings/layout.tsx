'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'
import { classNames } from '@arpansaha13/utils'
import { Separator } from '~/components/common'
import { _logout } from '~/utils/api'

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
    await _logout()
    window.location.reload()
  }

  return (
    <div className="h-full">
      <div className="flex h-full">
        <div className="h-full w-[28rem] bg-gray-300 py-16 transition-colors dark:bg-gray-800">
          <div className="ml-auto w-48">
            {tabs.map(tab => (
              <Link
                key={tab.name}
                href={tab.href}
                className={classNames(
                  'mt-1 block w-full rounded-l-md px-4 py-2 text-sm transition-colors first:mt-0',
                  pathname === tab.href ? 'bg-gray-100 dark:bg-gray-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700',
                )}
              >
                {tab.name}
              </Link>
            ))}

            <Separator />

            <button
              type="button"
              className="flex w-full justify-between rounded-l-md px-4 py-2 text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={logout}
            >
              <p>Log out</p>
              <ArrowRightStartOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
            </button>
          </div>
        </div>
        <div className="col-span-3 h-full flex-grow overflow-auto bg-gray-100 px-8 py-16 transition-colors dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  )
}
