'use client'

import { shallow } from 'zustand/shallow'
import { Icon } from '@iconify/react'
import pinIcon from '@iconify-icons/mdi/pin'
import ConvoItemTemplate from '~/components/Convo/ConvoItemTemplate'
import ConvoItemDropDown from '~/components/Convo/ConvoItemDropDown'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { ConvoItemType } from '@pkg/types'

export interface UnarchivedConvoItemProps {
  userId: number
  alias: string | null
  dp: string | null
  globalName: string
  latestMsg: ConvoItemType['latestMsg']
  pinned?: boolean
  onClick: () => void
}

export default function Page() {
  const [convo, setActiveChat] = useStore(state => [state.unarchived, state.setActiveChat], shallow)
  async function handleClick(convoItem: ConvoItemType) {
    setActiveChat({
      contact: convoItem.contact,
      receiver: convoItem.receiver,
    })
  }

  return (
    <ul>
      {convo.map(convoItem => (
        <UnarchivedConvoItem
          key={convoItem.chat.id}
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

function UnarchivedConvoItem({ userId, pinned = false, ...remainingProps }: UnarchivedConvoItemProps) {
  const [activeChat, setActiveChat, archiveRoom, deleteChat, deleteConvo, updateConvoPin] = useStore(
    state => [
      // Initially no rooms would be active - so `activeRoom` may be null
      state.activeChat,
      state.setActiveChat,
      state.archiveRoom,
      state.deleteChat,
      state.deleteConvo,
      state.updateConvoPin,
    ],
    shallow,
  )

  const menuItems = [
    {
      slot: 'Archive chat',
      onClick() {
        archiveRoom(userId)
      },
    },
    {
      slot: 'Delete chat',
      onClick() {
        deleteChat(userId)
        deleteConvo(userId, false)
        // If active room is being deleted
        if (activeChat && activeChat.receiver.id === userId) {
          setActiveChat(null)
        }
      },
    },
    {
      slot: !pinned ? 'Pin chat' : 'Unpin chat',
      onClick() {
        if (!pinned) {
          updateConvoPin(userId, true)
        } else {
          updateConvoPin(userId, false)
        }
      },
    },
  ]

  return (
    <ConvoItemTemplate {...remainingProps} userId={userId}>
      {pinned && <Icon icon={pinIcon} color="inherit" width={20} height={20} />}
      <ConvoItemDropDown menuItems={menuItems} />
    </ConvoItemTemplate>
  )
}
