import { IsNotEmpty, IsString } from 'class-validator'

export class UserSearchQuery {
  @IsNotEmpty()
  @IsString()
  text: string
}
