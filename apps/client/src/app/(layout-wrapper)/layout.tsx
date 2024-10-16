'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useDark } from '~/hooks/useDark'
import { SocketProvider } from '~/providers/SocketProvider'
import Notification from '~common/Notification'
import Navbar from '~/components/Navbar'
import { useAppDispatch, usePrefetch } from '~/store/hooks'
import { initGroupStore } from '~/store/features/groups/group.slice'
import { initChatList } from '~/store/features/chat-list/chat-list.slice'
import { initContactStore } from '~/store/features/contacts/contact.slice'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: Readonly<LayoutWrapperProps>) {
  useDark()
  usePrefetch('getAuthUser', undefined)

  const dispatch = useAppDispatch()
  const [hasLoaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    Promise.all([dispatch(initChatList()), dispatch(initContactStore()), dispatch(initGroupStore())]).then(() =>
      setLoaded(true),
    )
  }, [dispatch])

  if (!hasLoaded) {
    return <Loading />
  }

  return (
    <SocketProvider>
      <div className="flex h-screen">
        <Notification />

        <Navbar />

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
