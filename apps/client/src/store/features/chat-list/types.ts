import type { MessageStatus } from '@shared/types'
import type { IChatListItem, IContact } from '@shared/types/client'

export interface ChatListSliceType {
  unarchived: IChatListItem[]
  archived: IChatListItem[]

  activeChat: Pick<IChatListItem, 'receiver' | 'contact'> | null

  getActiveChat: () => ChatListSliceType['activeChat']

  setActiveChat: (newChatInfo: ChatListSliceType['activeChat']) => void

  upsertActiveChatContact: (receiverId: number, newContact: Pick<IContact, 'contactId' | 'alias'>) => void

  deleteActiveChatContact: (receiverId: number) => void

  initChatList: () => Promise<void>

  insertUnarchivedChat: (newItem: IChatListItem) => void

  updateChatListItemMessage: (receiverId: number, latestMsg: IChatListItem['latestMsg']) => void

  updateChatListItemMessageStatus: (
    receiverId: number,
    messageId: number,
    latestMsgStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
  ) => void

  updateChatListItemMessagePin: (receiverId: number, pinned: boolean) => void

  upsertChatListItemContact: (receiverId: number, newContact: Pick<IContact, 'contactId' | 'alias'>) => void

  deleteChatListItemContact: (receiverId: number) => void

  clearChatListItemMessage: (receiverId: number) => void

  searchChat: (receiverId: number) => IChatListItem | null

  archiveChat: (receiverId: number) => void

  unarchiveChat: (receiverId: number) => void

  deleteChat: (receiverId: number, archived?: boolean) => void
}
