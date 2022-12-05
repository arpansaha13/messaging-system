import { IsNotEmpty, IsNumber } from 'class-validator'

export class GetLatestMsgParamsDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number
}
