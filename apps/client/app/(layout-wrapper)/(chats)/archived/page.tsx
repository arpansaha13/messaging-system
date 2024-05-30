'use client'

import { shallow } from 'zustand/shallow'
import ChatListItemTemplate from '~/components/ChatListItem/Template'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { IChatListItem, IContextMenuItem } from '@pkg/types'

interface ArchivedConvoItemProps {
  userId: number
  alias: string | null
  dp: string | null
  globalName: string
  latestMsg: IChatListItem['latestMsg']
  onClick: () => void
}

export default function Page() {
  const [archived, setActiveChat] = useStore(state => [state.archived, state.setActiveChat], shallow)
  async function handleClick(convoItem: IChatListItem) {
    setActiveChat({
      contact: convoItem.contact ?? null,
      receiver: convoItem.receiver,
    })
  }

  return (
    <ul>
      {archived.map(convoItem => (
        <ArchivedConvoItem
          key={convoItem.receiver.id}
          userId={convoItem.receiver.id}
          dp={convoItem.receiver.dp}
          globalName={convoItem.receiver.globalName}
          alias={convoItem.contact?.alias ?? null}
          latestMsg={convoItem.latestMsg}
          onClick={() => handleClick(convoItem)}
        />
      ))}
    </ul>
  )
}

function ArchivedConvoItem({ userId, ...remainingProps }: ArchivedConvoItemProps) {
  const [activeChat, setActiveChat, unarchiveChat, deleteMessages, deleteChat] = useStore(
    state => [
      // `activeRoom` will be null when no chats are active
      state.activeChat,
      state.setActiveChat,
      state.unarchiveChat,
      state.deleteMessages,
      state.deleteChat,
    ],
    shallow,
  )

  const menuItems: IContextMenuItem[] = [
    {
      slot: 'Unarchive chat',
      onClick() {
        unarchiveChat(userId)
      },
    },
    {
      slot: 'Delete chat',
      onClick() {
        deleteMessages(userId)
        deleteChat(userId, true)
        // If active room is being deleted
        if (activeChat && activeChat.receiver.id === userId) {
          setActiveChat(null)
        }
      },
    },
  ]

  return <ChatListItemTemplate userId={userId} menuItems={menuItems} {...remainingProps} />
}
