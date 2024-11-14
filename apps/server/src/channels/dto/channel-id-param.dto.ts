import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import type { Channel } from 'src/channels/channel.entity'

export class ChannelIdParam {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  channelId: Channel['id']
}
