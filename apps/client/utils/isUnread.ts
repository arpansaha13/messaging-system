import { isNullOrUndefined } from '@arpansaha13/utils'
import { type ChatListItemType, MessageStatus } from '@pkg/types'

export default function isUnread(authUserId: number, latestMsg: ChatListItemType['latestMsg']) {
  let unread = false
  if (!isNullOrUndefined(latestMsg)) {
    const authUserIsSender = authUserId === latestMsg.senderId
    unread = !authUserIsSender && latestMsg.status !== MessageStatus.READ
  }
  return unread
}
