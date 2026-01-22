import { Group } from '../models/group'
import { Channel } from '../models/channel'
import { UserGroup } from '../models/user-group'
import type { GroupRepository } from '../repositories/group'
import type { CreateGroupDto, HandleNewChannelDto, HandleJoinGroupDto } from '../dto/group'
import type { RabbitMQService } from './rabbitmq'

export class GroupService {
  constructor(
    private readonly groupRepo: GroupRepository,
    private readonly rabbitmqService: RabbitMQService,
  ) {}

  async createGroup(context: any, createGroupDto: CreateGroupDto) {
    const authUser = context.user
    const em = this.groupRepo.manager

    return em.transaction(async txn => {
      const newGroup = await txn.save(txn.create(Group, { name: createGroupDto.name, founder: authUser }))
      const newChannel = await txn.save(txn.create(Channel, { name: 'default', group: newGroup }))
      await txn.save(txn.create(UserGroup, { group: newGroup, user: authUser }))

      // Publish group creation event to RabbitMQ
      await this.rabbitmqService.publishToIncoming('group.new', {
        type: 'NEW_GROUP',
        payload: {
          groupId: newGroup.id,
          channels: [newChannel.id].join(','),
        },
      })

      return { id: newGroup.id, channels: [newChannel.id] }
    })
  }

  getGroup(groupId: number) {
    return this.groupRepo.findById(groupId)
  }

  async handleNewChannel(context: any, dto: HandleNewChannelDto) {
    // Publish to incoming_messages exchange for worker to process
    await this.rabbitmqService.publishToIncoming('group.channel', {
      type: 'NEW_CHANNEL',
      payload: {
        groupId: dto.groupId,
        channelId: dto.channelId,
        name: dto.name,
      },
    })

    return { success: true }
  }

  async handleJoinGroup(context: any, dto: HandleJoinGroupDto) {
    const userId = context.user.id

    // Publish to incoming_messages exchange for worker to process
    await this.rabbitmqService.publishToIncoming('group.join', {
      type: 'JOIN_GROUP',
      payload: {
        userId,
        groupId: dto.groupId,
        channels: dto.channels.join(','),
      },
    })

    return { success: true }
  }
}
