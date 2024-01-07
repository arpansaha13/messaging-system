import { isNullOrUndefined } from '@arpansaha13/utils'
import { type ConvoItemType, MessageStatus } from '~/types'

export default function isUnread(authUserId: number, latestMsg: ConvoItemType['latestMsg']) {
  let unread = false
  if (!isNullOrUndefined(latestMsg)) {
    const authUserIsSender = authUserId === latestMsg.senderId
    unread = !authUserIsSender && latestMsg.status !== MessageStatus.READ
  }
  return unread
}
