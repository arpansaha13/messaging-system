'use client'

import { isNullOrUndefined } from '@arpansaha13/utils'
import { useStore } from '~/store'
import Chat from '~/components/Chat'

interface ChatsLayoutProps {
  children: React.ReactNode
}

export default function ChatsLayout({ children }: Readonly<ChatsLayoutProps>) {
  const activeChat = useStore(state => state.activeChat)

  return (
    <div className="flex h-full gap-2 p-2">
      <section className="flex h-full w-[26rem] flex-shrink-0 flex-col space-y-2 overflow-hidden rounded bg-gray-100 p-2 shadow-md dark:bg-gray-900">
        <div className="scrollbar flex-grow overflow-y-auto">{children}</div>
      </section>

      <section className="h-full flex-grow overflow-hidden rounded bg-gray-100 shadow-md dark:bg-gray-800">
        {!isNullOrUndefined(activeChat) && <Chat />}
      </section>
    </div>
  )
}
