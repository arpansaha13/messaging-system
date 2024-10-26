import type { IMessage } from '@shared/types'

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
  contact: {
    id: number
    alias: string
  } | null
}

export interface IAuthUser extends Omit<IUser, 'contact'> {
  email: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}

export interface IUserSearchResult extends IUser {
  contact: {
    id: number
    alias: string
  } | null
}

export interface IContact {
  id: number
  userId: number
  alias: string
  bio: string
  dp: string | null
  globalName: string
  username: string
}

export interface IContextMenuItem<T> {
  slot: string | React.ReactNode
  action: (e: React.MouseEvent, payload: T) => void
}

export interface IGroup {
  id: number
  name: string
  founder: IUser
}

export interface IChannel {
  id: number
  name: string
}
