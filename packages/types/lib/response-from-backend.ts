import { MessageStatus } from '@shared/constants'

export interface IContactResponseFromBE {
  id: number
  alias: string
  userInContact: {
    id: number
    bio: string
    dp: string | null
    username: string
    globalName: string
  }
}

export interface IChatListItemResponseFromBE {
  contact: {
    id: number
    alias: string
  } | null
  message: {
    id: number
    status: Exclude<MessageStatus, MessageStatus.SENDING>
    content: string
    senderId: number
    createdAt: string
  } | null
  chat: {
    receiver_id: number
    receiver_dp: string | null
    receiver_bio: string
    receiver_username: string
    receiver_global_name: string
    muted: boolean
    pinned: boolean
    archived: boolean
  }
}

export interface IChatsResponseFromBE {
  archived: IChatListItemResponseFromBE[]
  unarchived: IChatListItemResponseFromBE[]
}
