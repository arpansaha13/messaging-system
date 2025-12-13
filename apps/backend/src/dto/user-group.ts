import { IsNumberString } from 'class-validator'

export class UserIdParam {
  @IsNumberString()
  userId!: number
}

export class GroupIdParam {
  @IsNumberString()
  groupId!: number
}
