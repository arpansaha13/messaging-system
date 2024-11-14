import { Module } from '@nestjs/common'
import { ChannelService } from './channel.service'
import { ChannelRepository } from './channel.repository'
import { ChannelController } from './channel.controller'

@Module({
  controllers: [ChannelController],
  providers: [ChannelRepository, ChannelService],
  exports: [ChannelRepository],
})
export class ChannelModule {}
