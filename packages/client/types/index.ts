export interface ChatListItemType {
  /** user_id of the user with whom the chat is. */
  userId: number
  /** The display picture of the user. If the user has not set any dp then it will be `null`. */
  dp: string | null
  /** Alias of the user with whom the chat is. */
  name: string
  /** Timestamp of the latest message */
  time: number
  /** Whether the chat has been muted or not. */
  muted: boolean
  /** Whether the latest message has been read or not. */
  read: boolean
  /** The latest message in this chat. */
  text: string
}

interface BaseMessageType {
  msg: string
  /** Whether this message is posted by the logged-in user or not. */
  myMsg: boolean
}

interface MessageSendingType extends BaseMessageType {
  status: 'sending'
}
interface MessageConfirmedType extends BaseMessageType {
  time: number
  status: 'sent' | 'delivered' | 'read'
}

export type MessageType = MessageSendingType | MessageConfirmedType

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
  text: string
  dp: string | null
}

export interface JwtToken {
  authToken: string
  expiresAt: number
}
