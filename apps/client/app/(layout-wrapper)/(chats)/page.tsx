'use client'

import { shallow } from 'zustand/shallow'
import { Icon } from '@iconify/react'
import pinIcon from '@iconify-icons/mdi/pin'
import ChatListItemTemplate from '~/components/ChatListItem/Template'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { IChatListItem, IContextMenuItem } from '@pkg/types'

export interface UnarchivedConvoItemProps {
  userId: number
  alias: string | null
  dp: string | null
  globalName: string
  latestMsg: IChatListItem['latestMsg']
  pinned: boolean
  onClick: () => void
}

export default function Page() {
  const [unarchived, setActiveChat] = useStore(state => [state.unarchived, state.setActiveChat], shallow)
  async function handleClick(convoItem: IChatListItem) {
    setActiveChat({
      contact: convoItem.contact,
      receiver: convoItem.receiver,
    })
  }

  return (
    <ul className="space-y-1">
      {unarchived.map(convoItem => (
        <UnarchivedConvoItem
          key={convoItem.receiver.id}
          userId={convoItem.receiver.id}
          dp={convoItem.receiver.dp}
          globalName={convoItem.receiver.globalName}
          pinned={convoItem.chat.pinned}
          alias={convoItem.contact?.alias ?? null}
          latestMsg={convoItem.latestMsg}
          onClick={() => handleClick(convoItem)}
        />
      ))}
    </ul>
  )
}

function UnarchivedConvoItem({ userId, pinned, ...remainingProps }: UnarchivedConvoItemProps) {
  const [
    activeChat,
    setActiveChat,
    archiveChat,
    clearMessages,
    deleteMessages,
    deleteChat,
    clearChatListItemMessage,
    updateChatListItemMessagePin,
  ] = useStore(
    state => [
      // `activeRoom` will be null when no chats are active
      state.activeChat,
      state.setActiveChat,
      state.archiveChat,
      state.clearMessages,
      state.deleteMessages,
      state.deleteChat,
      state.clearChatListItemMessage,
      state.updateChatListItemMessagePin,
    ],
    shallow,
  )

  const menuItems: IContextMenuItem[] = [
    {
      slot: pinned ? 'Unpin chat' : 'Pin chat',
      action: () => {
        updateChatListItemMessagePin(userId, !pinned)
      },
    },
    {
      slot: 'Archive chat',
      action: () => {
        archiveChat(userId)
      },
    },
    {
      slot: 'Clear messages',
      action: () => {
        clearMessages(userId)
        clearChatListItemMessage(userId)
      },
    },
    {
      slot: 'Delete chat',
      action: () => {
        deleteMessages(userId)
        deleteChat(userId, false)
        // If active room is being deleted
        if (activeChat && activeChat.receiver.id === userId) {
          setActiveChat(null)
        }
      },
    },
  ]

  return (
    <ChatListItemTemplate userId={userId} menuItems={menuItems} {...remainingProps}>
      {pinned && <Icon icon={pinIcon} color="inherit" width={20} height={20} />}
    </ChatListItemTemplate>
  )
}
