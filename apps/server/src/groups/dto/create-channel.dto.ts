import { IsNotEmpty, IsString } from 'class-validator'
import type { Channel } from 'src/channels/channel.entity'

export class CreateChannelDto {
  @IsNotEmpty()
  @IsString()
  name: Channel['name']
}
