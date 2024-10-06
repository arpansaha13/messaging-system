import { Module } from '@nestjs/common'
import { ChannelRepository } from './channel.repository'

@Module({
  providers: [ChannelRepository],
})
export class ChannelModule {}
