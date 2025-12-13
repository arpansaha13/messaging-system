import { IsString, MinLength, IsNumberString } from 'class-validator'

export class CreateChannelDto {
  @IsString()
  @MinLength(1)
  name!: string
}

export class ChannelIdParam {
  @IsNumberString()
  channelId!: number
}

export class GroupIdParam {
  @IsNumberString()
  groupId!: number
}
