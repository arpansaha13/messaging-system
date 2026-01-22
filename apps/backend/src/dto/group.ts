import { IsString, MinLength, IsNumberString, IsArray, IsNumber } from 'class-validator'

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name!: string
}

export class GroupIdParam {
  @IsNumberString()
  groupId!: number
}

export class CreateChannelDto {
  @IsString()
  @MinLength(1)
  name!: string
}

export class HandleNewChannelDto {
  @IsNumber()
  groupId!: number

  @IsNumber()
  channelId!: number

  @IsString()
  name!: string
}

export class HandleJoinGroupDto {
  @IsNumber()
  groupId!: number

  @IsArray()
  @IsString({ each: true })
  channels!: string[]
}
