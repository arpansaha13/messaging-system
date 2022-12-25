import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'

export class UserSearchQuery {
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  search: number
}
