import { MessageStatus } from './message.types'

/** Generic type for chat-list item. A = archived, G = isGroup */
export interface ConvoItemType<A = false, G = false> {
  userToRoomId: number
  room: {
    id: number
    muted: boolean
    archived: A
    pinned: boolean
    isGroup: G
  }
  /** The user with whom the chat is. */
  user: {
    id: number
    dp: string | null
    bio: string
    displayName: string
  }
  /** Will be `null` if this user is not in contacts. */
  contact: null | {
    id: number
    alias: string
  }
  latestMsg: null | {
    content: string
    senderId: number
    status: MessageStatus
    createdAt: string
  }
}

export interface UserType {
  id: number
  bio: string
  dp: string | null
  displayName: string
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
  displayName: string
}

export interface JwtToken {
  authToken: string
  expiresAt: number
}
