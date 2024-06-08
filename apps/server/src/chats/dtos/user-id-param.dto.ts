import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import type { User } from 'src/users/user.entity'

export class UserIdParam {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  receiverId: User['id']
}
