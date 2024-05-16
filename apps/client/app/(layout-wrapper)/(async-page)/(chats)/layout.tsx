'use client'

import { shallow } from 'zustand/shallow'
import { useStore } from '~/store'
import Chat from '~/components/Chat'
import SidebarHeader from '~/components/Sidebar/SidebarHeader'

interface ChatsLayoutProps {
  children: React.ReactNode
}

export default function ChatsLayout({ children }: ChatsLayoutProps) {
  const [activeRoom, isProxyConvo] = useStore(state => [state.activeRoom, state.isProxyConvo], shallow)
  const showChatView = activeRoom !== null || isProxyConvo

  return (
    <div className="flex h-full">
      <section className="flex-shrink-0 w-[26rem] h-full bg-white dark:bg-transparent border-r border-gray-200 dark:border-gray-600/70 space-y-2 overflow-hidden flex flex-col">
        <SidebarHeader />
        {/* <SidebarSearchBar /> */}
        <div className="flex-grow overflow-y-auto scrollbar">{children}</div>
      </section>

      <section className="flex-grow h-full bg-gray-100 dark:bg-gray-800">{showChatView && <Chat />}</section>
    </div>
  )
}
