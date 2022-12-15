import { IsBoolean, IsNotEmpty, IsNumber, IsString, ValidateIf } from 'class-validator'

export class Ws1to1MessageDto {
  /** The message that was received. */
  @IsNotEmpty()
  @IsString()
  content: string

  /** Time at which the message was sent. */
  @IsNotEmpty()
  @IsString()
  ISOtime: string

  @ValidateIf((_, value) => value !== null) // Allow null
  @IsNumber()
  roomId: number | null

  @IsNotEmpty()
  @IsNumber()
  senderId: number

  @IsNotEmpty()
  @IsNumber()
  receiverId: number
}

export class WsTypingStateDto {
  @IsNotEmpty()
  @IsBoolean()
  isTyping: boolean

  /** Id of the user who is typing a message (sender). */
  @IsNotEmpty()
  @IsNumber()
  roomId: number

  /** Id of the user for whom the message is being typed (receiver). */
  @IsNotEmpty()
  @IsNumber()
  receiverId: number
}
