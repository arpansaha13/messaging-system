import { IsNumberString } from 'class-validator'

export class ChannelIdParam {
  @IsNumberString()
  channelId!: number
}

export class ReceiverIdParam {
  @IsNumberString()
  receiverId!: number
}
