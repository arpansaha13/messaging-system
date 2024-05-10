import { ConvoItemType } from '@pkg/types'

export interface UserConvoResponse {
  unarchived: ConvoItemType[]
  archived: ConvoItemType<true>[]
}
