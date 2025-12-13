import { type DataSource, Repository } from 'typeorm'
import { UserGroup } from '../models/user-group.entity'

export class UserGroupRepository extends Repository<UserGroup> {
  constructor(dataSource: DataSource) {
    super(UserGroup, dataSource.createEntityManager())
  }

  async getGroupsByUserId(userId: number) {
    const userGroups = await this.find({
      where: { user: { id: userId } },
      relations: { group: { founder: true } },
    })
    return userGroups.map(ug => ug.group)
  }

  async getGroupIdsByUserId(userId: number) {
    const userGroups = await this.find({
      where: { user: { id: userId } },
      loadRelationIds: { relations: ['group'] },
    })
    return userGroups.map(ug => ug.group as unknown as number)
  }

  async getMembersByGroupId(groupId: number) {
    const userGroups = await this.find({
      select: ['id', 'user'],
      where: { group: { id: groupId } },
      relations: { user: true },
    })
    return userGroups.map(ug => ug.user)
  }

  saveUserGroup(ug: Partial<UserGroup>) {
    const e = this.create(ug)
    return this.save(e)
  }
}
