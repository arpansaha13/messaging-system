import { isNullOrUndefined } from '@arpansaha13/utils'
import { MessageStatus } from '~/constants'
import type { IChatListItem } from '~/types'

export function isUnread(authUserId: number, latestMsg: IChatListItem['latestMsg']) {
  if (isNullOrUndefined(latestMsg)) {
    return false
  }
  const authUserIsSender = authUserId === latestMsg.senderId
  return !authUserIsSender && latestMsg.status !== MessageStatus.READ
}


