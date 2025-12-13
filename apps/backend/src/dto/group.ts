import { IsString, MinLength, IsNumberString } from 'class-validator'

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name!: string
}

export class GroupIdParam {
  @IsNumberString()
  groupId!: number
}
