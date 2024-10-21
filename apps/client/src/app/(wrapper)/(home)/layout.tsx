'use client'

import { isNullOrUndefined } from '@arpansaha13/utils'
import Chat from '~/components/chat'
import { Window, WindowBody, WindowPanel, WindowPanelBody } from '~/components/window'
import { useAppSelector } from '~/store/hooks'
import { selectActiveChat } from '~/store/features/chat-list/chat-list.slice'

interface ChatsLayoutProps {
  children: React.ReactNode
}

export default function ChatsLayout({ children }: Readonly<ChatsLayoutProps>) {
  const activeChat = useAppSelector(selectActiveChat)

  return (
    <Window>
      <WindowPanel className="w-[26rem]">
        <WindowPanelBody>{children}</WindowPanelBody>
      </WindowPanel>

      <WindowBody>{!isNullOrUndefined(activeChat) && <Chat />}</WindowBody>
    </Window>
  )
}
