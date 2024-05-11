'use client'

import { shallow } from 'zustand/shallow'
import ConvoItem from '~/components/Convo/ConvoItem'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { ConvoItemType, MessageType } from '@pkg/types'

export default function Page() {
  const [add, chats, convo, setActiveChatInfo, setActiveRoom, setProxyConvo] = useStore(
    state => [
      state.addChat,
      state.chats,
      state.unarchived,
      state.setActiveChatInfo,
      state.setActiveRoom,
      state.setProxyConvo,
    ],
    shallow,
  )
  async function handleClick(convoItem: ConvoItemType) {
    setActiveRoom({
      id: convoItem.room.id,
      archived: convoItem.room.archived,
    })
    setProxyConvo(false)
    setActiveChatInfo({
      contact: convoItem.contact ?? null,
      user: convoItem.user,
    })

    if (!chats.has(convoItem.room.id)) {
      const chatRes: MessageType[] = await _fetch(`rooms/${convoItem.room.id}/messages`)
      add(convoItem.room.id, chatRes)
    }
  }
  return (
    <div>
      <ul role="list">
        {convo.map(convoItem => (
          <ConvoItem
            key={convoItem.room.id}
            roomId={convoItem.room.id}
            dp={convoItem.user.dp}
            globalName={convoItem.user.globalName}
            pinned={convoItem.room.pinned}
            alias={convoItem.contact?.alias ?? null}
            latestMsg={convoItem.latestMsg}
            onClick={() => handleClick(convoItem)}
          />
        ))}
      </ul>
    </div>
  )
}
