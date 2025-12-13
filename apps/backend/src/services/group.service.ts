import { Group } from '../models/group.entity'
import { Channel } from '../models/channel.entity'
import { UserGroup } from '../models/user-group.entity'
import type { Request } from 'express'
import type { GroupRepository } from '../repositories/group.repository'
import type { CreateGroupDto } from '../dto/group.dto'

export class GroupService {
  constructor(private readonly groupRepo: GroupRepository) {}

  async createGroup(authUser: Request['user'], createGroupDto: CreateGroupDto) {
    const em = this.groupRepo.manager

    return em.transaction(async txn => {
      const newGroup = await txn.save(txn.create(Group, { name: createGroupDto.name, founder: authUser }))
      const newChannel = await txn.save(txn.create(Channel, { name: 'default', group: newGroup }))
      await txn.save(txn.create(UserGroup, { group: newGroup, user: authUser }))

      return { id: newGroup.id, channels: [newChannel.id] }
    })
  }

  getGroup(groupId: number) {
    return this.groupRepo.findById(groupId)
  }
}
