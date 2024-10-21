'use client'

import { useSearchParams } from 'next/navigation'
import Chat from '~/components/chat'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'

interface ChatsLayoutProps {
  children: React.ReactNode
}

export default function ChatsLayout({ children }: Readonly<ChatsLayoutProps>) {
  const searchParams = useSearchParams()
  const hasOpenChat = searchParams.get('to')

  return (
    <Window>
      <WindowPanel className="w-[26rem]">
        <WindowPanelBody>{children}</WindowPanelBody>
      </WindowPanel>

      <WindowBody>{hasOpenChat && <Chat />}</WindowBody>
    </Window>
  )
}
