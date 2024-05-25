'use client'

import { shallow } from 'zustand/shallow'
import ConvoItem from '~/components/Convo/ConvoItem'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { ConvoItemType, MessageType } from '@pkg/types'

export default function Page() {
  const [upsertChat, chats, convo, setActiveChat] = useStore(
    state => [state.upsertChat, state.chats, state.unarchived, state.setActiveChat],
    shallow,
  )
  async function handleClick(convoItem: ConvoItemType) {
    setActiveChat({
      contact: convoItem.contact,
      receiver: convoItem.receiver,
    })

    if (!chats.has(convoItem.receiver.id)) {
      const chatRes: MessageType[] = await _fetch(`messages/${convoItem.receiver.id}`)
      upsertChat(convoItem.receiver.id, chatRes)
    }
  }

  return (
    <div>
      <ul>
        {convo.map(convoItem => (
          <ConvoItem
            key={convoItem.chat.id}
            chatId={convoItem.chat.id}
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
    </div>
  )
}
