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
  globalName: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}
