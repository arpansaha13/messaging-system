import { Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { Group } from './group.entity'
import { GroupRepository } from './group.repository'
import { CreateGroupDto } from './dto/create-group.dto'
import { UserGroup } from 'src/user_group/user-group.entity'
import { UserGroupRepository } from 'src/user_group/user-group.repository'
import { Channel } from 'src/channels/channel.entity'
import { ChannelRepository } from 'src/channels/channel.repository'
import type { User } from 'src/users/user.entity'
import type { EntityManager } from 'typeorm'
import { CreateChannelDto } from './dto/create-channel.dto'

@Injectable()
export class GroupService {
  constructor(
    @InjectEntityManager()
    private manager: EntityManager,

    @InjectRepository(GroupRepository)
    private groupRepository: GroupRepository,

    @InjectRepository(ChannelRepository)
    private channelRepository: ChannelRepository,

    @InjectRepository(UserGroupRepository)
    private userGroupRepository: UserGroupRepository,
  ) {}

  async getGroupsOfUser(authUser: User): Promise<Group[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { user: { id: authUser.id } },
      relations: {
        group: {
          founder: true,
        },
      },
    })

    return userGroups.map(ug => ug.group)
  }

  getGroup(groupId: Group['id']): Promise<Group> {
    return this.groupRepository.findOne({
      where: { id: groupId },
      relations: { founder: true },
    })
  }

  async createGroup(authUser: User, createGroupDto: CreateGroupDto): Promise<Group> {
    const newGroup = await this.manager.transaction(async txnManager => {
      let newGroup = new Group()
      newGroup.name = createGroupDto.name
      newGroup.founder = authUser
      newGroup = await txnManager.save(Group, newGroup)

      const newUserGroup = new UserGroup()
      newUserGroup.group = newGroup
      newUserGroup.user = authUser
      await txnManager.save(UserGroup, newUserGroup)

      const newChannel = new Channel()
      newChannel.name = 'default'
      newChannel.group = newGroup
      await txnManager.save(Channel, newChannel)

      return newGroup
    })

    return newGroup
  }

  getChannelsOfGroup(groupId: Group['id']) {
    return this.channelRepository.getChannelsByGroupId(groupId)
  }

  async createChannel(groupId: Group['id'], createChannelDto: CreateChannelDto): Promise<Channel> {
    const channel = new Channel()
    const group = await this.groupRepository.findOne({
      select: ['id'],
      where: { id: groupId },
    })
    channel.name = createChannelDto.name
    channel.group = group
    return this.channelRepository.save(channel)
  }

  getMembersOfGroup(groupId: Group['id']): Promise<User[]> {
    return this.userGroupRepository.getMembersByGroupId(groupId)
  }
}
