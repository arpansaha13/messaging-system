import { Type } from 'class-transformer'
import { IsNumber } from 'class-validator'

export class GetChatParamsDto {
  @Type(() => Number)
  @IsNumber()
  userId: number
}
