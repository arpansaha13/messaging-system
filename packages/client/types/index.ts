export interface ChatListItemData {
  userTag: string
  dp: string
  name: string
  time: string
  muted: boolean
  read: boolean
  latestMsg: string
  active: boolean
}

export interface MessageType {
  msg: string
  /** Whether this message is posted by the logged-in user or not. */
  myMsg: boolean
  time: string
  status: 'sent' | 'delivered' | 'read'
}
