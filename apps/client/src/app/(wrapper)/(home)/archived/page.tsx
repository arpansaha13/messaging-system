'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChatListItem } from '~/components/list-items'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { deleteMessages } from '~/store/features/messages/message.slice'
import { unarchiveChat, deleteChat, selectArchived } from '~/store/features/chat-list/chat-list.slice'
import type { IChatListItem, IContextMenuItem } from '@shared/types/client'

interface ArchivedConvoItemProps {
  chatListItem: IChatListItem
}

export default function Page() {
  const archived = useAppSelector(selectArchived)

  return (
    <ul>
      {archived.map(chatListItem => (
        <ArchivedChatListItem key={chatListItem.receiver.id} chatListItem={chatListItem} />
      ))}
    </ul>
  )
}

function ArchivedChatListItem(props: ArchivedConvoItemProps) {
  const { chatListItem } = props

  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const router = useRouter()
  const receiverId = useMemo(() => (searchParams.has('to') ? parseInt(searchParams.get('to')!) : null), [searchParams])

  const menuItems: IContextMenuItem<void>[] = [
    {
      slot: 'Unarchive chat',
      action: () => {
        dispatch(unarchiveChat(chatListItem.receiver.id))
      },
    },
    {
      slot: 'Delete chat',
      action: () => {
        dispatch(deleteMessages(chatListItem.receiver.id))
        dispatch(deleteChat({ receiverId: chatListItem.receiver.id, archived: true }))
        // If active room is being deleted
        if (receiverId && receiverId === chatListItem.receiver.id) {
          const { pathname, searchParams } = new URL(window.location.href)
          const params = new URLSearchParams(searchParams)
          params.delete('to')
          router.replace(`${pathname}?${params.toString()}`)
        }
      },
    },
  ]

  return <ChatListItem chatListItem={chatListItem} menuItems={menuItems} />
}
