'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ChatListItemTemplate from '~/components/chat-list-item/Template'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { deleteMessages } from '~/store/features/messages/message.slice'
import { unarchiveChat, deleteChat, selectArchived } from '~/store/features/chat-list/chat-list.slice'

import type { IChatListItem, IContextMenuItem } from '@shared/types/client'

interface ArchivedConvoItemProps {
  userId: number
  alias: string | null
  dp: string | null
  globalName: string
  latestMsg: IChatListItem['latestMsg']
}

export default function Page() {
  const archived = useAppSelector(selectArchived)

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
        />
      ))}
    </ul>
  )
}

function ArchivedConvoItem({ userId, ...remainingProps }: ArchivedConvoItemProps) {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const router = useRouter()
  const receiverId = useMemo(() => (searchParams.has('to') ? parseInt(searchParams.get('to')!) : null), [searchParams])

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
        if (receiverId && receiverId === userId) {
          const { pathname, searchParams } = new URL(window.location.href)
          const params = new URLSearchParams(searchParams)
          params.delete('to')
          router.replace(`${pathname}?${params.toString()}`)
        }
      },
    },
  ]

  return <ChatListItemTemplate userId={userId} menuItems={menuItems} {...remainingProps} />
}
