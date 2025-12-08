import type { GroupRepository } from '../repositories/group.repository'
import AppDataSource from '../data-source'
import { Group } from '../models/group.entity'
import { Channel } from '../models/channel.entity'
import type { Request } from 'express'

export class GroupService {
  constructor(private readonly groupRepo: GroupRepository) {}

  async createGroup(authUser: Request['user'], createGroupDto: any) {
    const em = AppDataSource.manager
    return em.transaction(async txn => {
      let newGroup = txn.create(Group, { name: createGroupDto.name, founder: authUser })
      newGroup = await txn.save(newGroup)

      const newChannel = txn.create(Channel, { name: 'default', group: newGroup })
      await txn.save(newChannel)

      return { id: newGroup.id, channels: [newChannel.id] }
    })
  }

  getGroup(groupId: number) {
    return this.groupRepo.findById(groupId)
  }
}
