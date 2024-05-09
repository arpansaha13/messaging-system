import { ConvoItemType } from '@pkg/types'

export interface UserConvoResponse {
  unarchivedList: ConvoItemType[]
  archivedList: ConvoItemType<true>[]
}
