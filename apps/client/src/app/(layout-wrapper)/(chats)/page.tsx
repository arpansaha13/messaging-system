'use client'

import { useState } from 'react'
import { shallow } from 'zustand/shallow'
import { DialogTitle } from '@headlessui/react'
import { Icon } from '@iconify/react'
import pinIcon from '@iconify-icons/mdi/pin'
import { isNullOrUndefined } from '@arpansaha13/utils'
import BaseButton from '~base/BaseButton'
import Modal from '~common/Modal'
import Avatar from '~common/Avatar'
import ChatListItemTemplate from '~/components/chat-list-item/Template'
import { useStore } from '~/store'
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
  const [unarchived, setActiveChat] = useStore(state => [state.unarchived, state.setActiveChat], shallow)

  const [deleteChatModalOpen, setDeleteChatModalOpen] = useState(false)
  const [deleteChatModalPayload, setDeleteChatModalPayload] = useState<DeleteChatModalPayload | null>(null)

  async function handleClick(chatListItem: IChatListItem) {
    setActiveChat({
      contact: chatListItem.contact,
      receiver: chatListItem.receiver,
    })
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

  const [archiveChat, clearMessages, clearChatListItemMessage, updateChatListItemMessagePin] = useStore(
    state => [
      state.archiveChat,
      state.clearMessages,
      state.clearChatListItemMessage,
      state.updateChatListItemMessagePin,
    ],
    shallow,
  )

  const menuItems: IContextMenuItem[] = [
    {
      slot: chatListItem.chat.pinned ? 'Unpin chat' : 'Pin chat',
      action: () => {
        updateChatListItemMessagePin(chatListItem.receiver.id, !chatListItem.chat.pinned)
      },
    },
    {
      slot: 'Archive chat',
      action: () => {
        archiveChat(chatListItem.receiver.id)
      },
    },
    {
      slot: 'Clear messages',
      action: () => {
        clearMessages(chatListItem.receiver.id)
        clearChatListItemMessage(chatListItem.receiver.id)
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

  const [activeChat, setActiveChat, deleteMessages, deleteChat] = useStore(
    state => [state.activeChat, state.setActiveChat, state.deleteMessages, state.deleteChat],
    shallow,
  )

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (isNullOrUndefined(payload)) return

    deleteMessages(payload.receiver.id)
    deleteChat(payload.receiver.id, false)

    // If active room is being deleted
    if (activeChat && activeChat.receiver.id === payload.receiver.id) {
      setActiveChat(null)
    }

    setOpen(false)
  }

  return (
    <Modal open={open} setOpen={setOpen}>
      <div className="mt-3 sm:mt-5">
        <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Delete chat
        </DialogTitle>

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

        <form className="mt-4" onSubmit={onSubmit}>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2"
            >
              Delete
            </button>

            <BaseButton secondary className="mt-3 sm:col-start-1 sm:mt-0" onClick={() => setOpen(false)}>
              Cancel
            </BaseButton>
          </div>
        </form>
      </div>
    </Modal>
  )
}
