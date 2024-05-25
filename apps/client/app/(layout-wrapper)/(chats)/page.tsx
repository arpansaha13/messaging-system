'use client'

import { shallow } from 'zustand/shallow'
import ConvoItem from '~/components/Convo/ConvoItem'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { ConvoItemType } from '@pkg/types'

export default function Page() {
  const [convo, setActiveChat] = useStore(state => [state.unarchived, state.setActiveChat], shallow)
  async function handleClick(convoItem: ConvoItemType) {
    setActiveChat({
      contact: convoItem.contact,
      receiver: convoItem.receiver,
    })
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
