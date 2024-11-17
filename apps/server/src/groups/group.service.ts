import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { Group } from './group.entity'
import { GroupRepository } from './group.repository'
import { CreateGroupDto } from './dto/create-group.dto'
import { UserGroup } from 'src/user_group/user-group.entity'
import { UserGroupRepository } from 'src/user_group/user-group.repository'
import { Channel } from 'src/channels/channel.entity'
import { ChannelRepository } from 'src/channels/channel.repository'
import { Invite } from 'src/invites/invite.entity'
import { InviteRepository } from 'src/invites/invite.repository'
import { generateHash } from 'src/common/utils'
import { MoreThan, type EntityManager } from 'typeorm'
import type { User } from 'src/users/user.entity'
import type { CreateChannelDto } from './dto/create-channel.dto'
import type { CreateGroupResponse } from './interfaces/create-group.response'
import type { CreateChannelResponse } from './interfaces/create-channel.response'

@Injectable()
export class GroupService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,

    @InjectRepository(GroupRepository)
    private readonly groupRepository: GroupRepository,

    @InjectRepository(ChannelRepository)
    private readonly channelRepository: ChannelRepository,

    @InjectRepository(InviteRepository)
    private readonly inviteRepository: InviteRepository,

    @InjectRepository(UserGroupRepository)
    private readonly userGroupRepository: UserGroupRepository,
  ) {}

  async getGroupsOfUser(authUser: User): Promise<Group[]> {
    return this.userGroupRepository.getGroupsByUserId(authUser.id)
  }

  getGroup(groupId: Group['id']): Promise<Group> {
    return this.groupRepository.findOne({
      where: { id: groupId },
      relations: { founder: true },
    })
  }

  async createGroup(authUser: User, createGroupDto: CreateGroupDto): Promise<CreateGroupResponse> {
    return this.manager.transaction(async txnManager => {
      let newGroup = new Group()
      newGroup.name = createGroupDto.name
      newGroup.founder = authUser
      newGroup = await txnManager.save(Group, newGroup)

      const newUserGroup = new UserGroup()
      newUserGroup.group = newGroup
      newUserGroup.user = authUser
      await txnManager.save(UserGroup, newUserGroup)

      let newChannel = new Channel()
      newChannel.name = 'default'
      newChannel.group = newGroup
      newChannel = await txnManager.save(Channel, newChannel)

      return {
        id: newGroup.id,
        channels: [newChannel.id],
      }
    })
  }

  getChannelsOfGroup(groupId: Group['id']) {
    return this.channelRepository.getChannelsByGroupId(groupId)
  }

  async createChannel(groupId: Group['id'], createChannelDto: CreateChannelDto): Promise<CreateChannelResponse> {
    let newChannel = new Channel()
    const group = await this.groupRepository.findOne({
      select: ['id'],
      where: { id: groupId },
    })
    newChannel.name = createChannelDto.name
    newChannel.group = group
    newChannel = await this.channelRepository.save(newChannel)
    return {
      groupId: group.id,
      channelId: newChannel.id,
    }
  }

  getMembersOfGroup(groupId: Group['id']): Promise<User[]> {
    return this.userGroupRepository.getMembersByGroupId(groupId)
  }

  async createInvite(authUser: User, groupId: Group['id']): Promise<Invite> {
    const invite = await this.inviteRepository.findOne({
      where: { inviter: { id: authUser.id }, group: { id: groupId }, expiresAt: MoreThan(new Date()) },
      loadRelationIds: true,
    })

    if (invite) {
      return invite
    }

    const group = await this.groupRepository.findOne({ select: ['id'], where: { id: groupId } })

    if (!group) {
      throw new BadRequestException('Invalid group id')
    }

    const hash = generateHash(6)
    const timestamp = new Date()

    const newInvite = new Invite()
    newInvite.hash = hash
    newInvite.group = group
    newInvite.inviter = authUser
    newInvite.createdAt = timestamp
    newInvite.expiresAt = new Date(timestamp.getTime() + 24 * 60 * 60 * 1000) // add 1 day
    await this.inviteRepository.save(newInvite)
    return newInvite
  }
}
