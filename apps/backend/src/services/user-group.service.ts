import { UserGroupRepository } from '../repositories/user-group.repository'

export class UserGroupService {
  constructor(private repo: UserGroupRepository) {}

  getGroupsOfUser(userId: number) {
    return this.repo.getGroupsByUserId(userId)
  }

  getMembersOfGroup(groupId: number) {
    return this.repo.getMembersByGroupId(groupId)
  }

  addUserToGroup(userId: number, groupId: number) {
    return this.repo.saveUserGroup({ user: { id: userId } as any, group: { id: groupId } as any })
  }
}
