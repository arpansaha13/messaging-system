import type { IChatListItem } from './client/models'

export interface IChatsResponse {
  archived: IChatListItem[]
  unarchived: IChatListItem[]
}
