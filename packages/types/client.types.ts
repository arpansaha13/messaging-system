import type { IMessage } from './message.types'

/** Generic type for chat-list item. A = archived */
export interface IChatListItem {
  contact: {
    id: number
    alias: string
  } | null
  latestMsg: IMessage | null
  receiver: IUser
  chat: {
    muted: boolean
    archived: boolean
    pinned: boolean
  }
}

export interface IUser {
  id: number
  bio: string
  dp: string | null
  username: string
  globalName: string
}

export interface IAuthUser extends IUser {
  email: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}

export interface IContact {
  contactId: number
  userId: number
  alias: string
  bio: string
  dp: string | null
  globalName: string
  username: string
}

export interface IContextMenuItem {
  slot: string | React.ReactNode
  action: (e: React.MouseEvent, payload?: any) => void
}
