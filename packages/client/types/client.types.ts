import { MessageStatus } from './message.types'

export interface ChatListItemType {
  userToRoomId: number
  room: {
    id: number
    muted: boolean
    archived: false
    isGroup: false
    deleted: boolean
  }
  /** The user with whom the chat is. */
  user: {
    id: number
    dp: string | null
    bio: string
    displayName: string | null
  }
  /** Will be `null` if this user is not in contacts. */
  contact: null | {
    id: number
    alias: string
  }
  latestMsg: null | {
    content: string
    senderId: number
    status: MessageStatus | null
    createdAt: string
  }
}

export interface UserType {
  id: number
  bio: string
  dp: string | null
  displayName: string | null
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
  displayName: string | null
}

export interface JwtToken {
  authToken: string
  expiresAt: number
}
