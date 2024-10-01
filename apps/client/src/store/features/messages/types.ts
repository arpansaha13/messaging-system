import type { IMessage, IMessageSending, MessageStatus } from '@shared/types'

export interface MessageSliceType {
  /**
   * Messages mapped with receiver (user) id
   * Each message is mapped with their messageId.
   */
  userMessagesMap: Map<number, Map<number, IMessage>>
  getUserMessagesMap: () => MessageSliceType['userMessagesMap']

  /** Messages that are newly created and are being sent. */
  tempMessagesMap: Map<number, Map<string, IMessageSending>>

  upsertMessages: (receiverId: number, messages: IMessage[]) => void
  upsertTempMessages: (receiverId: number, messages: IMessageSending[]) => void

  updateMessageStatus: (
    receiverId: number,
    messageId: number,
    newStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
  ) => void

  clearMessages: (receiverId: number) => void
  deleteMessages: (receiverId: number) => void

  getTempMessage: (receiverId: number, hash: string) => IMessageSending
  deleteTempMessage: (receiverId: number, hash: string) => void
}
