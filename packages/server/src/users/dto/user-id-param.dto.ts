import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'

export class UserIdParam {
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  userId: number
}
