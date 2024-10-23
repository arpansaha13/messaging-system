'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import pinIcon from '@iconify-icons/mdi/pin'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { Avatar, ConfirmModal } from '~/components/common'
import ChatListItemTemplate from '~/components/chat-list-item/Template'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  deleteChat,
  archiveChat,
  setActiveChat,
  clearChatListItemMessage,
  updateChatListItemMessagePin,
} from '~/store/features/chat-list/chat-list.slice'
import { clearMessages, deleteMessages } from '~/store/features/messages/message.slice'
import type { IChatListItem, IContextMenuItem } from '@shared/types/client'

type DeleteChatModalPayload = Pick<IChatListItem, 'contact' | 'receiver'>

interface UnarchivedChatListItemProps {
  chatListItem: IChatListItem
  onClick: () => void
  setDeleteChatModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setDeleteChatModalPayload: React.Dispatch<React.SetStateAction<DeleteChatModalPayload | null>>
}

interface DeleteChatListItemModalProps {
  open: boolean
  payload: DeleteChatModalPayload | null
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Page() {
  const dispatch = useAppDispatch()
  const unarchived = useAppSelector(state => state.chatList.unarchived)

  const [deleteChatModalOpen, setDeleteChatModalOpen] = useState(false)
  const [deleteChatModalPayload, setDeleteChatModalPayload] = useState<DeleteChatModalPayload | null>(null)

  async function handleClick(chatListItem: IChatListItem) {
    dispatch(
      setActiveChat({
        contact: chatListItem.contact,
        receiver: chatListItem.receiver,
      }),
    )
  }

  return (
    <>
      <ul className="space-y-1">
        {unarchived.map(chatListItem => (
          <UnarchivedChatListItem
            key={chatListItem.receiver.id}
            chatListItem={chatListItem}
            onClick={() => handleClick(chatListItem)}
            setDeleteChatModalOpen={setDeleteChatModalOpen}
            setDeleteChatModalPayload={setDeleteChatModalPayload}
          />
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

function UnarchivedChatListItem(props: Readonly<UnarchivedChatListItemProps>) {
  const { chatListItem, setDeleteChatModalOpen, setDeleteChatModalPayload } = props

  const dispatch = useAppDispatch()

  const menuItems: IContextMenuItem[] = [
    {
      slot: chatListItem.chat.pinned ? 'Unpin chat' : 'Pin chat',
      action: () => {
        dispatch(
          updateChatListItemMessagePin({ receiverId: chatListItem.receiver.id, pinned: !chatListItem.chat.pinned }),
        )
      },
    },
    {
      slot: 'Archive chat',
      action: () => {
        dispatch(archiveChat(chatListItem.receiver.id))
      },
    },
    {
      slot: 'Clear messages',
      action: () => {
        dispatch(clearMessages(chatListItem.receiver.id))
        dispatch(clearChatListItemMessage(chatListItem.receiver.id))
      },
    },
    {
      slot: 'Delete chat',
      action: () => {
        setDeleteChatModalPayload({
          contact: chatListItem.contact,
          receiver: chatListItem.receiver,
        })
        setDeleteChatModalOpen(true)
      },
    },
  ]

  return (
    <ChatListItemTemplate
      userId={chatListItem.receiver.id}
      menuItems={menuItems}
      alias={chatListItem.contact?.alias ?? null}
      dp={chatListItem.receiver.dp}
      globalName={chatListItem.receiver.globalName}
      latestMsg={chatListItem.latestMsg}
      onClick={props.onClick}
    >
      {chatListItem.chat.pinned && <Icon icon={pinIcon} color="inherit" width={20} height={20} />}
    </ChatListItemTemplate>
  )
}

function DeleteChatListItemModal(props: Readonly<DeleteChatListItemModalProps>) {
  const { open, payload, setOpen } = props

  const dispatch = useAppDispatch()
  const activeChat = useAppSelector(state => state.chatList.activeChat)

  function onSubmit() {
    if (isNullOrUndefined(payload)) return

    dispatch(deleteMessages(payload.receiver.id))
    dispatch(deleteChat({ receiverId: payload.receiver.id, archived: false }))

    // If active room is being deleted
    if (activeChat && activeChat.receiver.id === payload.receiver.id) {
      dispatch(setActiveChat(null))
    }

    setOpen(false)
  }

  return (
    <ConfirmModal open={open} setOpen={setOpen} heading="Delete chat" action={onSubmit} submitButtonText="Delete">
      <>
        <div className="mx-auto mt-4 flex justify-center text-center">
          <Avatar
            src={payload?.receiver.dp}
            alt={`display picture of ${payload?.receiver.globalName}`}
            width={6}
            height={6}
          />
        </div>

        <div className="mt-2">
          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-300">
            {payload?.contact?.alias ?? payload?.receiver.globalName}
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
