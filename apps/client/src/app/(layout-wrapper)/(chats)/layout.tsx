'use client'

import { isNullOrUndefined } from '@arpansaha13/utils'
import { useStore } from '~/store'
import Chat from '~/components/chat'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'

interface ChatsLayoutProps {
  children: React.ReactNode
}

export default function ChatsLayout({ children }: Readonly<ChatsLayoutProps>) {
  const activeChat = useStore(state => state.activeChat)

  return (
    <Window>
      <WindowPanel className="w-[26rem]">
        <WindowPanelBody>{children}</WindowPanelBody>
      </WindowPanel>

      <WindowBody>{!isNullOrUndefined(activeChat) && <Chat />}</WindowBody>
    </Window>
  )
}
