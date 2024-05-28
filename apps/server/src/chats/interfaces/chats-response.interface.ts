import { IChatListItem } from '@pkg/types'

export interface IChatsResponse {
  unarchived: IChatListItem[]
  archived: IChatListItem[]
}
