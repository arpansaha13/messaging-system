import { IsNotEmpty, IsNumber } from 'class-validator'

export class RoomIdParamDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number
}
