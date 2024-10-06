import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import type { User } from '../user.entity'

export class UserIdParam {
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  userId: User['id']
}
