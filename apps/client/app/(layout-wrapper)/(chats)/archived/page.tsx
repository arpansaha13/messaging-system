'use client'

import { shallow } from 'zustand/shallow'
import ConvoItem from '~/components/Convo/ConvoItem'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { ConvoItemType, MessageType } from '@pkg/types'

export default function Page() {
  const [upsertChat, chats, archived, setActiveChat] = useStore(
    state => [state.upsertChat, state.chats, state.archived, state.setActiveChat],
    shallow,
  )
  async function handleClick(convoItem: ConvoItemType<true>) {
    setActiveChat({
      contact: convoItem.contact ?? null,
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
        {archived.map(convoItem => (
          <ConvoItem
            key={convoItem.receiver.id}
            chatId={convoItem.chat.id}
            userId={convoItem.receiver.id}
            dp={convoItem.receiver.dp}
            globalName={convoItem.receiver.globalName}
            alias={convoItem.contact?.alias ?? null}
            latestMsg={convoItem.latestMsg}
            archived={true}
            pinned={false}
            onClick={() => handleClick(convoItem)}
          />
        ))}
      </ul>
    </div>
  )
}
