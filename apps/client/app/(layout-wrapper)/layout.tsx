'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { shallow } from 'zustand/shallow'
import {
  ArchiveBoxIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import { useDark } from '~/hooks/useDark'
import { useSocketInit } from '~/hooks/useSocket'
import Avatar from '~common/Avatar'
import Notification from '~common/Notification'
import { useAuthStore } from '~/store/useAuthStore'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { AuthUserResType } from '@pkg/types'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: Readonly<LayoutWrapperProps>) {
  useDark()
  useSocketInit()
  const router = useRouter()

  const [authUser, setAuthUser] = useAuthStore(state => [state.authUser!, state.setAuthUser], shallow)
  const [initConvo, initContactStore] = useStore(state => [state.initConvo, state.initContactStore], shallow)

  const [hasLoaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    _fetch('auth/check-auth').then(({ valid }: any) => {
      if (!valid) {
        router.replace('/auth/login')
      } else {
        _fetch('users/me').then((authUserRes: AuthUserResType) => {
          setAuthUser(authUserRes)
          Promise.all([initConvo(), initContactStore()]).then(() => setLoaded(true))
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hasLoaded) {
    return <Loading />
  }

  return (
    <div className="flex h-screen">
      <Notification />

      <nav className="flex-shrink-0 py-4 w-16 h-full flex flex-col items-center bg-gray-100 dark:bg-gray-900 shadow-md">
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

        <Link href="/settings/profile" className="mt-4 block">
          <Avatar src={authUser.dp} width={2} height={2} />
        </Link>
      </nav>

      <main className="flex-grow">{children}</main>
    </div>
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
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex h-28 space-x-8 relative">
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
