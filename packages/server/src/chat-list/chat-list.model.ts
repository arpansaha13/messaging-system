import { MessageStatus } from 'src/chats/message.entity'

export class ChatListItemModel {
  /** User tag of the user with whom the chat is. */
  userId: number

  /** Dp of the user with whom the chat is. */
  dp: string | null

  /** Alias by which the logged-in user has saved this user in their contacts. If the user is not in thier contacts, then this property will be null. */
  alias: string | null

  /** A short bio of the user. */
  bio: string

  /** Time of the latest message */
  time: Date

  /** Whether the logged-in user has muted this chat or not. */
  muted: boolean

  /** Status of the latest message */
  status: MessageStatus

  /** The latest message */
  latestMsg: string
}
