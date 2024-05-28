import { ChatListItemType } from '@pkg/types'

export interface UserConvoResponse {
  unarchived: ChatListItemType[]
  archived: ChatListItemType<true>[]
}
