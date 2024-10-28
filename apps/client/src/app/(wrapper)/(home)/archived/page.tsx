'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChatListItem } from '~/components/list-items'
import { SkeletonChatList } from '~/components/skeleton'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { deleteMessages } from '~/store/features/messages/message.slice'
import {
  unarchiveChat,
  deleteChat,
  selectArchived,
  selectChatListStatus,
} from '~/store/features/chat-list/chat-list.slice'
import type { IChatListItem, IContextMenuItem } from '@shared/types/client'

export default function Page() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const archived = useAppSelector(selectArchived)
  const fetchStatus = useAppSelector(selectChatListStatus)
  const receiverId = useMemo(() => (searchParams.has('to') ? parseInt(searchParams.get('to')!) : null), [searchParams])

  const menuItems: IContextMenuItem<IChatListItem>[] = useMemo(
    () => [
      {
        slot: 'Unarchive chat',
        action: (_, payload) => {
          dispatch(unarchiveChat(payload.receiver.id))
        },
      },
      {
        slot: 'Delete chat',
        action: (_, payload) => {
          dispatch(deleteMessages(payload.receiver.id))
          dispatch(deleteChat({ receiverId: payload.receiver.id, archived: true }))
          // If active room is being deleted
          if (receiverId && receiverId === payload.receiver.id) {
            const { pathname, searchParams } = new URL(window.location.href)
            const params = new URLSearchParams(searchParams)
            params.delete('to')
            router.replace(`${pathname}?${params.toString()}`)
          }
        },
      },
    ],
    [dispatch, receiverId, router],
  )

  if (fetchStatus !== 'idle') {
    return <SkeletonChatList />
  }

  return (
    <ul>
      {archived.map(chatListItem => (
        <ChatListItem key={chatListItem.receiver.id} chatListItem={chatListItem} menuItems={menuItems} />
      ))}
    </ul>
  )
}
