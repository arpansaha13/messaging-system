'use client'

import ChatListItemTemplate from '~/components/chat-list-item/Template'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { deleteMessages } from '~/store/features/messages/message.slice'
import { setActiveChat, unarchiveChat, deleteChat } from '~/store/features/chat-list/chat-list.slice'

import type { IChatListItem, IContextMenuItem } from '@shared/types/client'

interface ArchivedConvoItemProps {
  userId: number
  alias: string | null
  dp: string | null
  globalName: string
  latestMsg: IChatListItem['latestMsg']
  onClick: () => void
}

export default function Page() {
  const dispatch = useAppDispatch()
  const archived = useAppSelector(state => state.chatList.unarchived)

  async function handleClick(convoItem: IChatListItem) {
    dispatch(
      setActiveChat({
        contact: convoItem.contact ?? null,
        receiver: convoItem.receiver,
      }),
    )
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
  const dispatch = useAppDispatch()
  const activeChat = useAppSelector(state => state.chatList.activeChat)

  const menuItems: IContextMenuItem[] = [
    {
      slot: 'Unarchive chat',
      action: () => {
        dispatch(unarchiveChat(userId))
      },
    },
    {
      slot: 'Delete chat',
      action: () => {
        dispatch(deleteMessages(userId))
        dispatch(deleteChat({ receiverId: userId, archived: true }))
        // If active room is being deleted
        if (activeChat && activeChat.receiver.id === userId) {
          dispatch(setActiveChat(null))
        }
      },
    },
  ]

  return <ChatListItemTemplate userId={userId} menuItems={menuItems} {...remainingProps} />
}
