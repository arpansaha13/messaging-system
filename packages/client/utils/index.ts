import { type ConvoItemType, MessageStatus } from '../types/index.types'

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
export function isNullOrUndefined(v: any): v is null | undefined {
  return v === null || typeof v === 'undefined'
}
export function ISODateNow() {
  return new Date(Date.now()).toISOString()
}

export function ISOToMilliSecs(ISODate: string) {
  return new Date(ISODate).getTime()
}
export function isUnread(authUserId: number, latestMsg: ConvoItemType['latestMsg']) {
  let unread = false
  if (!isNullOrUndefined(latestMsg)) {
    const authUserIsSender = authUserId === latestMsg.senderId
    unread = !authUserIsSender && latestMsg.status !== MessageStatus.READ
  }
  return unread
}
