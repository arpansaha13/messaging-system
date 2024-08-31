import { IChatListItem } from '@shared/types'

export interface IChatsResponse {
  unarchived: IChatListItem[]
  archived: IChatListItem[]
}
