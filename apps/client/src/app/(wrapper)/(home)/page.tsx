'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import pinIcon from '@iconify-icons/mdi/pin'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { Avatar, ConfirmModal } from '~/components/common'
import { SkeletonChatList } from '~/components/skeleton'
import { ChatListItem } from '~/components/list-items'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  deleteChat,
  archiveChat,
  selectUnarchived,
  clearChatListItemMessage,
  updateChatListItemMessagePin,
  selectChatListStatus,
} from '~/store/features/chat-list/chat-list.slice'
import { clearMessages, deleteMessages } from '~/store/features/messages/message.slice'
import type { IChatListItem, IContextMenuItem } from '@shared/types/client'

type DeleteChatModalPayload = Pick<IChatListItem, 'receiver'>

interface DeleteChatListItemModalProps {
  open: boolean
  payload: DeleteChatModalPayload | null
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Page() {
  const dispatch = useAppDispatch()
  const unarchived = useAppSelector(selectUnarchived)
  const fetchStatus = useAppSelector(selectChatListStatus)
  const [deleteChatModalOpen, setDeleteChatModalOpen] = useState(false)
  const [deleteChatModalPayload, setDeleteChatModalPayload] = useState<DeleteChatModalPayload | null>(null)

  const menuItems: IContextMenuItem<IChatListItem>[] = useMemo(
    () => [
      {
        slot: payload => (payload.chat.pinned ? 'Unpin chat' : 'Pin chat'),
        action: (_, payload) => {
          dispatch(updateChatListItemMessagePin({ receiverId: payload.receiver.id, pinned: !payload.chat.pinned }))
        },
      },
      {
        slot: 'Archive chat',
        action: (_, payload) => {
          dispatch(archiveChat(payload.receiver.id))
        },
      },
      {
        slot: 'Clear messages',
        action: (_, payload) => {
          dispatch(clearMessages(payload.receiver.id))
          dispatch(clearChatListItemMessage(payload.receiver.id))
        },
      },
      {
        slot: 'Delete chat',
        action: (_, payload) => {
          setDeleteChatModalPayload({ receiver: payload.receiver })
          setDeleteChatModalOpen(true)
        },
      },
    ],
    [dispatch],
  )

  if (fetchStatus !== 'idle') {
    return <SkeletonChatList />
  }

  return (
    <>
      <ul className="space-y-1">
        {unarchived.map(chatListItem => (
          <ChatListItem key={chatListItem.receiver.id} chatListItem={chatListItem} menuItems={menuItems}>
            {chatListItem.chat.pinned && <Icon icon={pinIcon} color="inherit" width={20} height={20} />}
          </ChatListItem>
        ))}
      </ul>

      <DeleteChatListItemModal
        open={deleteChatModalOpen}
        setOpen={setDeleteChatModalOpen}
        payload={deleteChatModalPayload}
      />
    </>
  )
}

function DeleteChatListItemModal(props: Readonly<DeleteChatListItemModalProps>) {
  const { open, payload, setOpen } = props

  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const router = useRouter()
  const receiverId = useMemo(() => (searchParams.has('to') ? parseInt(searchParams.get('to')!) : null), [searchParams])

  function onSubmit() {
    if (isNullOrUndefined(payload)) return

    dispatch(deleteMessages(payload.receiver.id))
    dispatch(deleteChat({ receiverId: payload.receiver.id, archived: false }))

    // If active room is being deleted
    if (receiverId && receiverId === payload.receiver.id) {
      const { pathname, searchParams } = new URL(window.location.href)
      const params = new URLSearchParams(searchParams)
      params.delete('to')
      router.replace(`${pathname}?${params.toString()}`)
    }

    setOpen(false)
  }

  return (
    <ConfirmModal open={open} setOpen={setOpen} heading="Delete chat" action={onSubmit} submitButtonText="Delete">
      <>
        <div className="mx-auto mt-4 flex justify-center text-center">
          <Avatar src={payload?.receiver.dp} alt={`display picture of ${payload?.receiver.globalName}`} size={6} />
        </div>

        <div className="mt-2">
          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-300">
            {payload?.receiver.contact?.alias ?? payload?.receiver.globalName}
          </p>
        </div>

        <div className="mt-2">
          <p className="text-center text-sm text-gray-500 dark:text-gray-300">{payload?.receiver.bio}</p>
        </div>

        <p className="mt-2 text-center">
          Are you sure you want to delete this chat? The messages can no longer be recovered.
        </p>
      </>
    </ConfirmModal>
  )
}
