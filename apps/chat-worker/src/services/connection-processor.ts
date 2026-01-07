import AppDataSource from '../data-source'
import { ChannelRepository } from '../repositories/channel'
import { UserGroupRepository } from '../repositories/user-group'
import type { RabbitMQService } from './rabbitmq.service'

export class ConnectionProcessor {
  private readonly channelRepo: ChannelRepository
  private readonly userGroupRepo: UserGroupRepository

  constructor(private readonly rabbitmqService: RabbitMQService) {
    this.channelRepo = new ChannelRepository(AppDataSource)
    this.userGroupRepo = new UserGroupRepository(AppDataSource)
  }

  async processUserConnection(payload: { userId: number; serverId: string }): Promise<void> {
    try {
      const { userId, serverId } = payload

      const groupIds = await this.userGroupRepo.getGroupIdsByUserId(userId)
      const channelIds = await this.channelRepo.getChannelIdsByGroupIds(groupIds)

      // Publish subscription data to the subscription exchange with server ID as routing key
      // This way only the specific server that the user connected to will receive it
      await this.rabbitmqService.publishToSubscription(serverId, {
        userId,
        groupIds,
        channelIds,
      })

      console.log(
        `Processed connection for user ${userId}: groups=[${groupIds.join(',')}], channels=[${channelIds.join(',')}]`,
      )
    } catch (error) {
      console.error('Error processing user connection:', error)
      throw error
    }
  }
}
