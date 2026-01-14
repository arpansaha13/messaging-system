import type { Request } from 'express'
import { UserGroupRepository } from '../repositories/user-group'

export class UserGroupService {
  constructor(private readonly repo: UserGroupRepository) {}

  getGroupsOfUser(context: Request['context']) {
    const userId = context.user.id
    return this.repo.getGroupsByUserId(userId)
  }

  getMembersOfGroup(groupId: number) {
    return this.repo.getMembersByGroupId(groupId)
  }

  addUserToGroup(context: any, groupId: number) {
    const userId = context.user.id
    return this.repo.save(this.repo.create({ user: { id: userId }, group: { id: groupId } }))
  }
}
