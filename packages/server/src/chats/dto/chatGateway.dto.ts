import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator'

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

  @IsNotEmpty()
  @IsNumber()
  roomId: number

  /** Id of the user for whom the message is being typed (receiver). */
  @IsNotEmpty()
  @IsNumber()
  receiverId: number
}

export class WsOpenedOrReadChatDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number

  /** Id of the user whose messages are being read (sender). */
  @IsNotEmpty()
  @IsNumber()
  senderId: number

  /** Time at which the message was sent. */
  @IsOptional()
  @IsString()
  ISOtime?: string

  /**
   * Id of the user who has opened the chat and read the messages (receiver).
   * This will be the **auth-user**.
   */
  @IsNotEmpty()
  @IsNumber()
  receiverId: number
}
