import { isNullOrUndefined } from '@arpansaha13/utils'
import { MessageStatus } from '@shared/constants'
import type { IChatListItem } from '~/types'

export default function isUnread(authUserId: number, latestMsg: IChatListItem['latestMsg']) {
  let unread = false
  if (!isNullOrUndefined(latestMsg)) {
    const authUserIsSender = authUserId === latestMsg.senderId
    unread = !authUserIsSender && latestMsg.status !== MessageStatus.READ
  }
  return unread
}
