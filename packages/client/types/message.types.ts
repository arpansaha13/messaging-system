interface BaseMessageType {
  msg: string
  /** Whether this message is posted by the logged-in user or not. */
  myMsg: boolean
}
/** When the message sending process is initiated. */
interface MessageSendingType extends BaseMessageType {
  status: 'sending'
  myMsg: true
}
/** When the message is successfully stored in the database. */
interface MessageConfirmedType extends BaseMessageType {
  time: number
  myMsg: true
  status: 'sent' | 'delivered' | 'read'
}
/** When a message is received from some other user. */
interface MessageReceivedType extends BaseMessageType {
  time: number
  myMsg: false
}

export type MessageType =
  | MessageSendingType
  | MessageConfirmedType
  | MessageReceivedType
