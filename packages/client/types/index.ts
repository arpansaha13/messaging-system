export * from './message.types'

export interface ChatListItemType {
  /** user_id of the user with whom the chat is. */
  userId: number
  /** The display picture of the user. If the user has not set any dp then it will be `null`. */
  dp: string | null
  /** Alias of the user with whom the chat is. */
  alias: string
  /** A short bio of the user. */
  bio: string
  /** Timestamp of the latest message */
  time: string
  /** Whether the chat has been muted or not. */
  muted: boolean
  /** Whether the latest message has been read or not. */
  status: boolean
  /** The latest message in this chat. */
  latestMsg: string
}

export interface UserType {
  id: number
  name: string
  dp: string | null
  about: string
}
export interface AuthUserType extends UserType {
  email: string
}

export interface ContactType {
  /** user_id of the contact-user */
  userId: number
  /** Alias by which the auth-user has stored this contact. */
  name: string
  /** About or Bio of the contact-user. */
  bio: string
  dp: string | null
}

export interface JwtToken {
  authToken: string
  expiresAt: number
}
