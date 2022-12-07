import { MessageStatus } from './message.types'

/** Generic response type for rooms. A = archived, G = isGroup */
export interface UserToRoomResType<A = false, G = false> {
  userToRoomId: number
  archived: A
  deleted: boolean
  isMuted: boolean
  room: {
    id: number
    isGroup: G
  }
}
export type ArchivedUserToRoomResType = UserToRoomResType<true>

/** G = isGroup */
export interface RoomResType<G = true> {
  id: number
  isGroup: G
}

export interface ContactResType {
  id: number
  alias: string
  userInContact: {
    id: number
    bio: string
    dp: string | null
    displayName: string
  }
}

export type MsgResType = null | {
  content: string
  senderId: number
  status: MessageStatus | null
  createdAt: string
}

export interface AuthUserResType {
  id: number
  bio: string
  email: string
  dp: string | null
  displayName: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}
