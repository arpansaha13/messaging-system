import { type DataSource, Repository } from 'typeorm'
import { UserGroup } from '../models/user-group.entity'

export class UserGroupRepository extends Repository<UserGroup> {
  constructor(dataSource: DataSource) {
    super(UserGroup, dataSource.createEntityManager())
  }

  async getGroupsByUserId(userId: number) {
    const userGroups = await this.find({
      where: { user: { id: userId } } as any,
      relations: { group: { founder: true } } as any,
    })
    return userGroups.map((ug: any) => ug.group)
  }

  async getGroupIdsByUserId(userId: number) {
    const userGroups = await this.find({
      where: { user: { id: userId } } as any,
      loadRelationIds: { relations: ['group'] } as any,
    })
    return userGroups.map((ug: any) => ug.group) as number[]
  }

  async getMembersByGroupId(groupId: number) {
    const userGroups = await this.find({
      select: ['id', 'user'] as any,
      where: { group: { id: groupId } } as any,
      relations: { user: true } as any,
    })
    return userGroups.map((ug: any) => ug.user)
  }

  saveUserGroup(ug: Partial<UserGroup>) {
    const e = this.create(ug as any)
    return this.save(e)
  }
}
