export interface ChatListItemType {
  userTag: string
  dp: string | null
  name: string
  time: number
  muted: boolean
  read: boolean
  latestMsg: string
}

export interface MessageType {
  msg: string
  /** Whether this message is posted by the logged-in user or not. */
  myMsg: boolean
  time: number
  status: 'sent' | 'delivered' | 'read'
}

export interface UserDataType {
  userTag: string
  name: string
  dp: string
}