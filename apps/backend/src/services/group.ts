import { Group } from '../models/group'
import { Channel } from '../models/channel'
import { UserGroup } from '../models/user-group'
import type { Request } from 'express'
import type { GroupRepository } from '../repositories/group'
import type { CreateGroupDto } from '../dto/group'

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
