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
      id: convoItem.chat.id,
      archived: convoItem.chat.archived,
    })
    setProxyConvo(false)
    setActiveChatInfo({
      contact: convoItem.contact ?? null,
      receiver: convoItem.receiver,
    })

    if (!chats.has(convoItem.chat.id)) {
      const chatRes: MessageType[] = await _fetch(`messages/${convoItem.chat.id}`)
      add(convoItem.chat.id, chatRes)
    }
  }

  return (
    <div>
      <ul role="list">
        {convo.map(convoItem => (
          <ConvoItem
            key={convoItem.chat.id}
            roomId={convoItem.chat.id}
            dp={convoItem.receiver.dp}
            globalName={convoItem.receiver.globalName}
            pinned={convoItem.chat.pinned}
            alias={convoItem.contact?.alias ?? null}
            latestMsg={convoItem.latestMsg}
            onClick={() => handleClick(convoItem)}
          />
        ))}
      </ul>
    </div>
  )
}
