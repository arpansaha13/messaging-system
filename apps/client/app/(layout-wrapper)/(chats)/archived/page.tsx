'use client'

import { shallow } from 'zustand/shallow'
import ConvoItemTemplate from '~/components/Convo/ConvoItemTemplate'
import ConvoItemDropDown from '~/components/Convo/ConvoItemDropDown'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { ConvoItemType } from '@pkg/types'

interface ArchivedConvoItemProps {
  userId: number
  alias: string | null
  dp: string | null
  globalName: string
  latestMsg: ConvoItemType['latestMsg']
  onClick: () => void
}

export default function Page() {
  const [archived, setActiveChat] = useStore(state => [state.archived, state.setActiveChat], shallow)
  async function handleClick(convoItem: ConvoItemType<true>) {
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
  const [activeChat, setActiveChat, unarchiveRoom, deleteChat, deleteConvo] = useStore(
    state => [
      // Initially no rooms would be active - so `activeChat` may be null
      state.activeChat,
      state.setActiveChat,
      state.unarchiveRoom,
      state.deleteChat,
      state.deleteConvo,
    ],
    shallow,
  )

  const menuItems = [
    {
      slot: 'Unarchive chat',
      onClick() {
        unarchiveRoom(userId)
      },
    },
    {
      slot: 'Delete chat',
      onClick() {
        deleteChat(userId)
        deleteConvo(userId, true)
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
