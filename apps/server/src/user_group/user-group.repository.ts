import { Injectable } from '@nestjs/common'
import { Repository, DataSource } from 'typeorm'
import { UserGroup } from './user-group.entity'
import type { User } from 'src/users/user.entity'
import type { Group } from 'src/groups/group.entity'

@Injectable()
export class UserGroupRepository extends Repository<UserGroup> {
  constructor(private readonly dataSource: DataSource) {
    super(UserGroup, dataSource.createEntityManager())
  }

  /** Get only the ids of the groups that the user belongs to. */
  async getGroupIdsByUserId(userId: User['id']): Promise<Group['id'][]> {
    const userGroups = await this.find({
      where: { user: { id: userId } },
      loadRelationIds: { relations: ['group'] },
    })

    return userGroups.map(userGroup => userGroup.group) as unknown as Group['id'][]
  }

  async getMembersByGroupId(groupId: Group['id']): Promise<User[]> {
    const userGroups = await this.find({
      select: ['id', 'user'],
      where: { group: { id: groupId } },
      relations: { user: true },
    })
    return userGroups.map(userGroup => userGroup.user)
  }
}
