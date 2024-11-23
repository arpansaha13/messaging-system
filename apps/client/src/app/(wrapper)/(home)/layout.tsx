'use client'

import { useSearchParams } from 'next/navigation'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'
import PersonalChat from './personal-chat'

interface ChatsLayoutProps {
  children: React.ReactNode
}

export default function ChatsLayout({ children }: Readonly<ChatsLayoutProps>) {
  const searchParams = useSearchParams()
  const hasOpenChat = searchParams.get('to')

  return (
    <Window>
      <WindowPanel>
        <WindowPanelBody>{children}</WindowPanelBody>
      </WindowPanel>

      <WindowBody>{hasOpenChat && <PersonalChat />}</WindowBody>
    </Window>
  )
}
