import { IsString, IsNotEmpty, IsNumberString } from 'class-validator'

export class InviteHashParam {
  @IsString()
  @IsNotEmpty()
  hash!: string
}

export class GroupIdParam {
  @IsNumberString()
  groupId!: number
}
