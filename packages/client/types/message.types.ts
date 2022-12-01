interface BaseMsgType {
  msg: string
  /** Whether this message is posted by the logged-in user or not. */
  myMsg: boolean
  time: number
}
/** When the message sending process is initiated. */
interface MsgSendingType extends BaseMsgType {
  status: 'sending'
  myMsg: true
}
/** When the message is successfully stored in the database. */
export interface MsgConfirmedType extends BaseMsgType {
  myMsg: true
  status: 'sent' | 'delivered' | 'read'
}
/** When a message is received from some other user. */
interface MsgReceivedType extends BaseMsgType {
  myMsg: false
}

export type MessageType = MsgSendingType | MsgConfirmedType | MsgReceivedType
