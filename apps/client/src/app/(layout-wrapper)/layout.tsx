'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { forwardRef, useEffect, useState } from 'react'
import { shallow } from 'zustand/shallow'
import {
  ArchiveBoxIcon,
  UsersIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { classNames } from '@arpansaha13/utils'
import { useDark } from '~/hooks/useDark'
import { SocketProvider } from '~/providers/SocketProvider'
import Avatar from '~common/Avatar'
import Separator from '~common/Separator'
import Notification from '~common/Notification'
import AddGroup from '~/components/Group/AddGroup'
import { useStore } from '~/store'
import { _getMe } from '~/utils/api'

interface LayoutWrapperProps {
  children: React.ReactNode
}

interface LinkWrapperProps {
  children: React.ReactNode
}

const navItems = Object.freeze([
  {
    type: 'link' as const,
    to: '/',
    name: 'Chats',
    icon: ChatBubbleOvalLeftEllipsisIcon,
  },
  {
    type: 'link' as const,
    to: '/contacts',
    name: 'Contacts',
    icon: UsersIcon,
  },
  {
    type: 'link' as const,
    to: '/search',
    name: 'Search',
    icon: MagnifyingGlassIcon,
  },
  { type: 'separator' as const },
  {
    type: 'add-group' as const,
  },
  { type: 'spacer' as const },
  { type: 'separator' as const },
  {
    type: 'link' as const,
    to: '/archived',
    name: 'Archived',
    icon: ArchiveBoxIcon,
  },
  {
    type: 'link' as const,
    to: '/settings/profile',
    name: 'Settings',
    icon: Cog6ToothIcon,
  },
])

export default function LayoutWrapper({ children }: Readonly<LayoutWrapperProps>) {
  useDark()
  const pathname = usePathname()

  const [authUser, setAuthUser, initChatList, initContactStore] = useStore(
    state => [state.authUser!, state.setAuthUser, state.initChatList, state.initContactStore],
    shallow,
  )

  const [hasLoaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    _getMe().then(async authUserRes => {
      setAuthUser(authUserRes)
      await Promise.all([initChatList(), initContactStore()])
      setLoaded(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hasLoaded) {
    return <Loading />
  }

  return (
    <SocketProvider>
      <div className="flex h-screen">
        <Notification />

        <nav className="flex h-full w-16 flex-shrink-0 flex-col items-center gap-0.5 bg-gray-100 py-4 shadow-md dark:bg-gray-900">
          {navItems.map((navItem, i) => {
            if (navItem.type === 'separator') {
              return <Separator key={i} className="w-4/5" />
            }

            if (navItem.type === 'spacer') {
              return <div key={i} className="flex-grow" />
            }

            if (navItem.type === 'add-group') {
              return <AddGroup key={i} />
            }

            return (
              <LinkWrapper key={navItem.to}>
                <Link
                  href={navItem.to}
                  className={classNames(
                    'mx-auto block w-max rounded p-2 transition-colors',
                    pathname === navItem.to && 'bg-brand-300 text-brand-900 dark:bg-brand-800 dark:text-brand-200',
                  )}
                >
                  <span className="sr-only">{navItem.name}</span>
                  <LinkIcon idx={i} className="h-6 w-6 flex-shrink-0" />
                </Link>
              </LinkWrapper>
            )
          })}

          <LinkWrapper>
            <Link href="/settings/profile" className="mx-wuto mx-auto block w-max">
              <Avatar src={authUser.dp} width={2} height={2} />
            </Link>
          </LinkWrapper>
        </nav>

        <main className="flex-grow">{children}</main>
      </div>
    </SocketProvider>
  )
}

function Loading() {
  const logos = [
    { src: '/nextjs-icon.svg', alt: 'NextJs logo' },
    { src: '/reactjs-icon.svg', alt: 'React logo' },
    { src: '/nestjs-icon.svg', alt: 'NestJs logo' },
    { src: '/postgresql-icon.svg', alt: 'PostgreSQL logo' },
  ]

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex h-28 space-x-8">
        {logos.map(logo => (
          <Image
            key={logo.src}
            src={logo.src}
            alt={logo.alt}
            width={112}
            height={112}
            placeholder="blur"
            blurDataURL={logo.src}
            className="animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}

const LinkIcon = forwardRef((props: any, ref) => {
  const { idx, ...remaining } = props
  const IconComponent = navItems[idx].icon!

  return <IconComponent ref={ref} {...remaining} />
})

LinkIcon.displayName = 'LinkIcon'

function LinkWrapper({ children }: Readonly<LinkWrapperProps>) {
  return (
    <div className="group relative w-full last:mt-4">
      {children}

      <span className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors group-hover:bg-gray-900 dark:group-hover:bg-gray-100" />
    </div>
  )
}
