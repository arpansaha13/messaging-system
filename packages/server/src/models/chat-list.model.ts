import { MessageStatus } from 'src/entities/message.entity'

export class ChatListItemModel {
  /** User tag oif the user with whom the chat is */
  readonly userTag: string

  /** Dp of the user with whom the chat is. */
  dp: string | null

  /** Alias by which the logged-in user has saved this user in thier contacts. If the user is not in thier contacts, then this property will be null. */
  alias: string | null

  /** Time of the latest message */
  time: number

  /** Whether the logged-in user has muted this chat or not. */
  muted: boolean

  /** Status of the latest message */
  status: MessageStatus

  /** The latest message */
  latestMsg: string
}
