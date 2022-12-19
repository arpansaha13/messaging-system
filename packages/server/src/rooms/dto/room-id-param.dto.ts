import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'

export class RoomIdParam {
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  roomId: number
}
