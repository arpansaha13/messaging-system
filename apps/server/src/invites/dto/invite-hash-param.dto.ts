import { IsNotEmpty, IsString } from 'class-validator'

export class InviteHashparam {
  @IsNotEmpty()
  @IsString()
  hash: string
}
