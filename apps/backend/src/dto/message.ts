import { IsNumberString, IsString, MinLength, IsArray, IsNumber } from 'class-validator'

export class ChannelIdParam {
  @IsNumberString()
  channelId!: number
}

export class ReceiverIdParam {
  @IsNumberString()
  receiverId!: number
}

export class SendPersonalMessageDto {
  @IsNumber()
  receiverId!: number

  @IsString()
  @MinLength(1)
  content!: string

  @IsString()
  hash!: string
}

export class SendGroupMessageDto {
  @IsNumber()
  groupId!: number

  @IsNumber()
  channelId!: number

  @IsString()
  @MinLength(1)
  content!: string

  @IsString()
  hash!: string
}

export class HandleDeliveredDto {
  @IsNumber()
  messageId!: number

  @IsNumber()
  receiverId!: number

  @IsString()
  senderId!: string
}

export class HandleReadDto {
  @IsNumber()
  messageId!: number

  @IsNumber()
  senderId!: number

  @IsNumber()
  receiverId!: number
}

export class HandleReadMultipleDto {
  @IsArray()
  messages!: HandleReadDto[]
}
