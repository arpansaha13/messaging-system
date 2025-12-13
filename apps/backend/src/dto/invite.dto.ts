import { IsString, IsNotEmpty, IsNumberString } from 'class-validator'

export class InviteHashParam {
  @IsString()
  @IsNotEmpty()
  hash!: string
}
