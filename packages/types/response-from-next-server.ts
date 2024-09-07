import type { IChatListItem } from './client/models'

export interface IChatsResponse {
  archived: IChatListItem[]
  unarchived: IChatListItem[]
}

export interface AuthUserResType {
  id: number
  bio: string
  email: string
  username: string
  dp: string | null
  globalName: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}
