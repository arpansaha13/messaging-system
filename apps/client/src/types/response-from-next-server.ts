import type { IChatListItem } from './models'

export interface IChatsResponse {
  archived: IChatListItem[]
  unarchived: IChatListItem[]
}
