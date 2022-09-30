export class MessageModel {
  msg: string
  /** Whether this message is posted by the logged-in user or not. */
  myMsg: boolean
  time: number
  status: MessageStatus
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}
