import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ChannelRepository } from './channel.repository'
import type { Channel } from './channel.entity'

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(ChannelRepository)
    private readonly channelRepository: ChannelRepository,
  ) {}

  getChannel(channelId: Channel['id']): Promise<Channel> {
    return this.channelRepository.findOne({
      where: { id: channelId },
    })
  }
}
