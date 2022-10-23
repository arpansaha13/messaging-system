export interface ChatListItemType {
  /** user_id of the user with whom the chat is. */
  user_id: number
  dp: string | null
  /** Alias of the user with whom the chat is. */
  name: string
  /** Timestamp of the latest message */
  time: number
  /** Whether the chat has been muted or not. */
  muted: boolean
  read: boolean
  /** The latest message in this chat. */
  latestMsg: string
}

export interface MessageType {
  msg: string
  /** Whether this message is posted by the logged-in user or not. */
  myMsg: boolean
  time: number
  status: 'sent' | 'delivered' | 'read'
}

export interface UserType {
  id: number
  name: string
  dp: string
  about: string
}

export interface ContactType {
  /** user_id of the contact-user */
  user_id: number
  /** Alias by which the auth-user has stored this contact. */
  name: string
  /** About or Bio of the contact-user. */
  text: string
  dp: string
}

export interface JwtToken {
  authToken: string
  expiresAt: number
}
