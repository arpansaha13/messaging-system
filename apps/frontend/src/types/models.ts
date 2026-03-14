import type { IMessage } from './message'

export interface IChatListItem {
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
  globalName: string
  contact: {
    id: number
    alias: string
  } | null
}

export interface IUserGroup {
  id: number
  user: IUser
  groupId: number
  role: string
  updatedAt: string
  createdAt: string
}

export interface IAuthUser extends Omit<IUser, 'contact'> {
  email: string
  username: string
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
  // username: string
}

export interface IGroup {
  id: number
  name: string
  founderId?: number
  founder?: IUser
}

export interface IChannel {
  id: number
  name: string
}

export interface IInvite {
  hash: string
  inviterId: number
  groupId?: number
  createdAt?: string
  updatedAt?: string
  expiresAt?: string
}
