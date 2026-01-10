import { SocketEvents } from '@shared/constants'
import { ChannelRepository } from '../repositories/channel'
import { RabbitMQService } from './rabbitmq'

export class ChannelService {
  constructor(
    private readonly repo: ChannelRepository,
    private readonly rabbitmqService: RabbitMQService,
  ) {}

  getChannelsOfGroup(groupId: number) {
    return this.repo.getChannelsByGroupId(groupId)
  }

  getChannel(channelId: number) {
    return this.repo.findOne({ where: { id: channelId } })
  }

  async createChannel(groupId: number, createChannelDto: any) {
    const channel = await this.repo.save(
      this.repo.create({
        name: createChannelDto.name,
        group: { id: groupId },
      }),
    )

    // Publish channel creation event to RabbitMQ
    // Use group:{groupId} as routing key so all servers with users in this group receive it
    try {
      await this.rabbitmqService.publishToOutgoing(`group:${groupId}`, {
        event: SocketEvents.GROUP.NEW_CHANNEL,
        groupId: groupId,
        data: {
          id: channel.id,
          name: channel.name,
          groupId: groupId,
          createdAt: channel.createdAt,
        },
      })
    } catch (error) {
      console.error('Error publishing channel creation event:', error)
      // Don't throw - channel was created successfully, just event publishing failed
    }

    return { groupId: groupId, channelId: channel.id }
  }
}
