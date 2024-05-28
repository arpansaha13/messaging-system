'use client'

import { shallow } from 'zustand/shallow'
import ConvoItemTemplate from '~/components/Convo/ConvoItemTemplate'
import ConvoItemDropDown from '~/components/Convo/ConvoItemDropDown'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { ChatListItemType } from '@pkg/types'

interface ArchivedConvoItemProps {
  userId: number
  alias: string | null
  dp: string | null
  globalName: string
  latestMsg: ChatListItemType['latestMsg']
  onClick: () => void
}

export default function Page() {
  const [archived, setActiveChat] = useStore(state => [state.archived, state.setActiveChat], shallow)
  async function handleClick(convoItem: ChatListItemType<true>) {
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

  const menuItems = [
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

  return (
    <ConvoItemTemplate {...remainingProps} userId={userId}>
      <ConvoItemDropDown menuItems={menuItems} />
    </ConvoItemTemplate>
  )
}
