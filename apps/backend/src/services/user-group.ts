import { UserGroupRepository } from '../repositories/user-group'

export class UserGroupService {
  constructor(private readonly repo: UserGroupRepository) {}

  getGroupsOfUser(userId: number) {
    return this.repo.getGroupsByUserId(userId)
  }

  getMembersOfGroup(groupId: number) {
    return this.repo.getMembersByGroupId(groupId)
  }

  addUserToGroup(userId: number, groupId: number) {
    return this.repo.save(this.repo.create({ user: { id: userId }, group: { id: groupId } }))
  }
}
