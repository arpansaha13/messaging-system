'use client'

import { shallow } from 'zustand/shallow'
import { useStore } from '~/store'
import Chat from '~/components/Chat'

interface ChatsLayoutProps {
  children: React.ReactNode
}

export default function ChatsLayout({ children }: Readonly<ChatsLayoutProps>) {
  const [activeRoom, isProxyConvo] = useStore(state => [state.activeRoom, state.isProxyConvo], shallow)
  const showChatView = activeRoom !== null || isProxyConvo

  return (
    <div className="p-2 flex h-full gap-2">
      <section className="p-2 flex-shrink-0 w-[26rem] h-full bg-white dark:bg-gray-900 shadow-md space-y-2 flex flex-col rounded overflow-hidden">
        <div className="flex-grow overflow-y-auto scrollbar">{children}</div>
      </section>

      <section className="flex-grow h-full bg-gray-100 dark:bg-gray-800 shadow-md rounded overflow-hidden">
        {showChatView && <Chat />}
      </section>
    </div>
  )
}
