import { isNullOrUndefined } from '@arpansaha13/utils'
import { type IChatListItem, MessageStatus } from '@shared/types'

export default function isUnread(authUserId: number, latestMsg: IChatListItem['latestMsg']) {
  let unread = false
  if (!isNullOrUndefined(latestMsg)) {
    const authUserIsSender = authUserId === latestMsg.senderId
    unread = !authUserIsSender && latestMsg.status !== MessageStatus.READ
  }
  return unread
}
