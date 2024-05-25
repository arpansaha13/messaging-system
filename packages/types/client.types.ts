import type { MessageType } from './message.types'

/** Generic type for chat-list item. A = archived */
export interface ConvoItemType<A = false> {
  contact: {
    id: number
    alias: string
  } | null
  latestMsg: MessageType | null
  receiver: {
    id: number
    dp: string | null
    username: string
    globalName: string
  }
  chat: {
    id: number
    muted: boolean
    archived: A
    pinned: boolean
  }
}

export interface UserType {
  id: number
  bio: string
  dp: string | null
  globalName: string
}
export interface AuthUserType extends UserType {
  email: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}

export interface ContactType {
  contactId: number
  userId: number
  alias: string
  bio: string
  dp: string | null
  globalName: string
  username: string
}
