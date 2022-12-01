import type { MsgConfirmedType } from './message.types'

export interface ReceiveMsgType {
  userId: number
  msg: string
  time: number
}

export interface MsgStatusType {
  userId: number
  time: number
  status: MsgConfirmedType['status']
}
